"""Dataset for the conditional graph generator (lab Task 8).

900 undirected graphs on n = 24 nodes, 300 from each of three random graph
families. The family label is only ever used to balance the splits — the
generator never sees it. What the generator is conditioned on is the pair

    c(G) = [rho(G), t(G)],  rho = 2|E| / (n(n-1)),  t = T(G) / n

i.e. edge density and triangles per node.
"""

import numpy as np
import networkx as nx

N_NODES = 24
N_PER_FAMILY = 300
FAMILIES = ("erdos_renyi", "watts_strogatz", "stochastic_block")


# --- Task 8: graph properties ---------------------------------------------

def graph_properties(G):
    """Edge density and number of triangles per node."""
    n = G.number_of_nodes()
    m = G.number_of_edges()
    density = 2.0 * m / (n * (n - 1)) if n > 1 else 0.0
    # nx.triangles counts, for each node, the triangles through it; every
    # triangle is therefore counted three times.
    triangles = sum(nx.triangles(G).values()) / 3.0
    return density, triangles / n


def node_features(G):
    """Two features per node: normalised degree and normalised mean
    neighbour degree. Both are invariant to renaming the nodes."""
    n = G.number_of_nodes()
    deg = dict(G.degree())
    feats = np.zeros((n, 2), dtype=np.float32)
    for i, v in enumerate(sorted(G.nodes())):
        d = deg[v] / (n - 1)
        nbrs = list(G.neighbors(v))
        mean_nbr = (
            float(np.mean([deg[u] / (n - 1) for u in nbrs])) if nbrs else 0.0
        )
        feats[i] = (d, mean_nbr)
    return feats


def degree_guided_bfs_order(G):
    """Deterministic BFS ordering, highest degree first.

    A practical ordering heuristic, NOT a canonical labelling: two isomorphic
    graphs can still come out ordered differently when degrees tie.
    """
    deg = dict(G.degree())
    # Ties are broken by node id, which is what makes this deterministic for a
    # *given* labelling — but not invariant to relabelling.
    remaining = sorted(G.nodes(), key=lambda v: (-deg[v], v))
    seen, order = set(), []
    for root in remaining:
        if root in seen:
            continue
        seen.add(root)
        queue = [root]
        while queue:
            v = queue.pop(0)
            order.append(v)
            nbrs = sorted(
                (u for u in G.neighbors(v) if u not in seen),
                key=lambda u: (-deg[u], u),
            )
            for u in nbrs:
                seen.add(u)
                queue.append(u)
    return order


def ordered_adjacency(G, order):
    return nx.to_numpy_array(G, nodelist=order, dtype=np.float32)


# --- the three families ----------------------------------------------------

def sample_graph(family, rng):
    """One graph, with the family's parameters drawn as the handout specifies."""
    while True:
        if family == "erdos_renyi":
            p = rng.uniform(0.12, 0.30)
            G = nx.erdos_renyi_graph(N_NODES, p, seed=int(rng.integers(1 << 31)))
        elif family == "watts_strogatz":
            k = int(rng.choice([4, 6]))
            b = rng.uniform(0.02, 0.95)
            G = nx.watts_strogatz_graph(
                N_NODES, k, b, seed=int(rng.integers(1 << 31))
            )
        else:
            p_in = rng.uniform(0.25, 0.55)
            p_out = rng.uniform(0.02, 0.12)
            G = nx.stochastic_block_model(
                [N_NODES // 2, N_NODES // 2],
                [[p_in, p_out], [p_out, p_in]],
                seed=int(rng.integers(1 << 31)),
            )
            G = nx.Graph(G)
        G.remove_edges_from(nx.selfloop_edges(G))
        if G.number_of_edges() > 0:
            return G


def build_dataset(seed=0):
    rng = np.random.default_rng(seed)
    records = []
    for family in FAMILIES:
        for _ in range(N_PER_FAMILY):
            G = sample_graph(family, rng)
            rho, t = graph_properties(G)
            order = degree_guided_bfs_order(G)
            records.append(
                {
                    "family": family,
                    "graph": G,
                    "A": ordered_adjacency(G, order),
                    "X": node_features(G)[np.argsort(np.argsort(order))],
                    "c": np.array([rho, t], dtype=np.float32),
                }
            )
    return records


def stratified_split(records, seed=0):
    """70 / 15 / 15, balanced across the three families."""
    rng = np.random.default_rng(seed)
    train, val, test = [], [], []
    for family in FAMILIES:
        idx = [i for i, r in enumerate(records) if r["family"] == family]
        rng.shuffle(idx)
        n = len(idx)
        a, b = int(0.70 * n), int(0.85 * n)
        train += idx[:a]
        val += idx[a:b]
        test += idx[b:]
    return sorted(train), sorted(val), sorted(test)


if __name__ == "__main__":
    recs = build_dataset()
    tr, va, te = stratified_split(recs)
    print(f"{len(recs)} graphs · split {len(tr)}/{len(va)}/{len(te)}")
    C = np.stack([r["c"] for r in recs])
    for name in FAMILIES:
        sel = np.array([r["family"] == name for r in recs])
        c = C[sel]
        print(f"  {name:18s} rho {c[:,0].min():.3f}–{c[:,0].max():.3f} "
              f"(mean {c[:,0].mean():.3f})   t {c[:,1].min():.2f}–{c[:,1].max():.2f} "
              f"(mean {c[:,1].mean():.2f})")
    print(f"  ALL                rho {C[:,0].min():.3f}–{C[:,0].max():.3f}   "
          f"t {C[:,1].min():.2f}–{C[:,1].max():.2f}")
    Ctr = C[tr]
    print(f"  train mean {Ctr.mean(0)} std {Ctr.std(0)}")
