"""Conditional variational graph autoencoder (lab Tasks 9, 10, 11).

    encoder   q_phi(z | G, c)  = N(mu, diag(sigma^2))
    decoder   p_theta(G | z, c) -> n(n-1)/2 edge logits
    loss      BCE(upper triangle) + beta * KL + lambda * property loss
"""

import math
import torch
import torch.nn as nn
import torch.nn.functional as F

N_NODES = 24
N_PAIRS = N_NODES * (N_NODES - 1) // 2
BETA = 0.005

# Indices of the strictly upper triangle, in row-major order.
TRIU = torch.triu_indices(N_NODES, N_NODES, offset=1)


def normalize_adj(A):
    """A_hat = D^-1/2 (A + I) D^-1/2, batched."""
    eye = torch.eye(A.shape[-1], device=A.device).expand_as(A)
    At = A + eye
    d = At.sum(-1)
    dinv = torch.where(d > 0, d.pow(-0.5), torch.zeros_like(d))
    return dinv.unsqueeze(-1) * At * dinv.unsqueeze(-2)


def logits_to_prob_matrix(logits):
    """276 logits -> symmetric [B, n, n] probability matrix, zero diagonal."""
    B = logits.shape[0]
    P = torch.zeros(B, N_NODES, N_NODES, device=logits.device, dtype=logits.dtype)
    p = torch.sigmoid(logits)
    P[:, TRIU[0], TRIU[1]] = p
    return P + P.transpose(1, 2)


def upper_triangle(A):
    """[B, n, n] -> [B, 276], the entries the decoder actually predicts."""
    return A[:, TRIU[0], TRIU[1]]


class CondVGAE(nn.Module):
    def __init__(self, in_dim=2, hidden=64, latent=16, cond=2, dec_hidden=256):
        super().__init__()
        # Task 9: two message-passing layers, each followed by an MLP.
        self.mlp1 = nn.Sequential(
            nn.Linear(in_dim, hidden), nn.ReLU(), nn.Linear(hidden, hidden), nn.ReLU()
        )
        self.mlp2 = nn.Sequential(
            nn.Linear(hidden, hidden), nn.ReLU(), nn.Linear(hidden, hidden), nn.ReLU()
        )
        self.fc_mu = nn.Linear(hidden + cond, latent)
        self.fc_logvar = nn.Linear(hidden + cond, latent)
        # Task 10: one-shot decoder over node pairs i < j.
        self.decoder = nn.Sequential(
            nn.Linear(latent + cond, dec_hidden), nn.ReLU(),
            nn.Linear(dec_hidden, dec_hidden), nn.ReLU(),
            nn.Linear(dec_hidden, N_PAIRS),
        )
        self.latent = latent

    def encode(self, A, X, c_std):
        A_hat = normalize_adj(A)
        H1 = self.mlp1(A_hat @ X)
        H2 = self.mlp2(A_hat @ H1)
        h_G = H2.mean(dim=1)  # mean readout: invariant to node order
        h = torch.cat([h_G, c_std], dim=-1)
        return self.fc_mu(h), self.fc_logvar(h)

    @staticmethod
    def reparameterize(mu, logvar):
        std = torch.exp(0.5 * logvar)
        return mu + std * torch.randn_like(std)

    def decode(self, z, c_std):
        return self.decoder(torch.cat([z, c_std], dim=-1))

    def forward(self, A, X, c_std):
        mu, logvar = self.encode(A, X, c_std)
        z = self.reparameterize(mu, logvar)
        return self.decode(z, c_std), mu, logvar


# --- Task 11: the loss -----------------------------------------------------

def expected_density(P):
    """rho_hat(P) = 2 / (n(n-1)) * sum_{i<j} P_ij."""
    return upper_triangle(P).sum(-1) * 2.0 / (N_NODES * (N_NODES - 1))


def expected_triangles_per_node(P):
    """t_hat(P) = tr(P^3) / (6n), the expected count under independent edges."""
    P3 = P @ P @ P
    trace = P3.diagonal(dim1=-2, dim2=-1).sum(-1)
    return trace / (6.0 * N_NODES)


def loss_function(logits, A_target, mu, logvar, c_true, prop_std,
                  beta=None, lam=0.0):
    """Returns (total, bce, kl, prop). `c_true` is the UNstandardised [rho, t]."""
    # Resolved at call time, not bound as a default, so a sweep can vary it.
    if beta is None:
        beta = BETA
    target = upper_triangle(A_target)
    bce = F.binary_cross_entropy_with_logits(logits, target, reduction="none")
    bce = bce.sum(-1).mean()

    kl = -0.5 * torch.sum(1 + logvar - mu.pow(2) - logvar.exp(), dim=-1).mean()

    if lam > 0:
        P = logits_to_prob_matrix(logits)
        rho_hat = expected_density(P)
        t_hat = expected_triangles_per_node(P)
        prop = 0.5 * (
            ((rho_hat - c_true[:, 0]) / prop_std[0]).pow(2)
            + ((t_hat - c_true[:, 1]) / prop_std[1]).pow(2)
        ).mean()
    else:
        prop = torch.zeros((), device=logits.device)

    return bce + beta * kl + lam * prop, bce.detach(), kl.detach(), prop.detach()


@torch.no_grad()
def generate(model, c_requested, c_mean, c_std_vec, n_samples=1,
             mode="bernoulli", generator=None):
    """Sample z ~ N(0, I), condition on c, return adjacency matrices and P."""
    device = next(model.parameters()).device
    c = torch.as_tensor(c_requested, dtype=torch.float32, device=device)
    if c.dim() == 1:
        c = c.unsqueeze(0)
    c = c.repeat_interleave(n_samples, dim=0)
    c_in = (c - c_mean) / c_std_vec
    z = torch.randn(c.shape[0], model.latent, device=device, generator=generator)
    P = logits_to_prob_matrix(model.decode(z, c_in))
    if mode == "threshold":
        A = (P > 0.5).float()
    else:
        U = torch.rand(P.shape, device=device, generator=generator)
        A = (U < P).float()
        A = torch.triu(A, diagonal=1)
        A = A + A.transpose(1, 2)
    A = A * (1 - torch.eye(N_NODES, device=device))
    return A, P
