"use client";

import Link from "next/link";

export default function AuthBottomLink({
  prefix,
  linkText,
  href,
}: {
  prefix: string;
  linkText: string;
  href: string;
}) {
  return (
    <p className="text-center text-sm text-gray-950 mt-4">
      {prefix}{" "}
      <Link href={href} className="text-primary underline">
        {linkText}
      </Link>
    </p>
  );
}
