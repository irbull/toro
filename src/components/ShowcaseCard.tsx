import type { BlogFrontmatter } from "../content/_schemas.ts";

export interface Props {
  href?: string;
  frontmatter: BlogFrontmatter;
  secHeading?: boolean;
}

export default function Card({ href, frontmatter, secHeading = true }: Props) {
  const { title, description } = frontmatter;
  return (
    <li className="my-6">
      <div className="flex flex-row space-x-2">
        {frontmatter.icon
          ? (
            <img
              src={frontmatter.icon}
              alt={frontmatter.title}
              width="48"
              height="48"
              className="w-16 object-scale-down"
            />
          )
          : (
            <>
              <div className="w-16"></div>
            </>
          )}
        <div className="grid">
          <a
            href={href}
            className="inline-block text-lg font-medium text-skin-accent decoration-dashed underline-offset-4 focus-visible:no-underline focus-visible:underline-offset-0"
          >
            {secHeading
              ? (
                <h2 className="text-lg font-medium decoration-dashed hover:underline">
                  {title}
                </h2>
              )
              : (
                <h3 className="text-lg font-medium decoration-dashed hover:underline">
                  {title}
                </h3>
              )}
          </a>
          <p>{description}</p>
        </div>
      </div>
    </li>
  );
}
