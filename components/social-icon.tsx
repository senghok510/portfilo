import Image from "next/image";
import emailLogo from "@/images/logos/email_logo.png";
import githubLogo from "@/images/logos/github_logo.png";
import linkedinLogo from "@/images/logos/linkedin_logo.png";

const logos = {
  Email: emailLogo,
  GitHub: githubLogo,
  LinkedIn: linkedinLogo,
};

export function SocialIcon({ name }: { name: string }) {
  const logo = logos[name as keyof typeof logos];
  if (!logo) return null;

  return (
    <Image
      src={logo}
      alt=""
      aria-hidden
      className="size-[18px] shrink-0 rounded-sm object-contain"
    />
  );
}
