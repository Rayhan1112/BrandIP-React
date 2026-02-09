export type ProjectItem = {
  id: string;
  title: string;
  image: string;
  /** Optional link (e.g. case study URL) */
  href?: string;
};

type ProjectsDoneProps = {
  title?: string;
  projects: ProjectItem[];
};

export function ProjectsDone({ title = 'Projects Done', projects }: ProjectsDoneProps) {
  if (!projects.length) return null;

  return (
    <section className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <h2 className="text-3xl sm:text-[32px] font-bold text-[#1A1A1A] mb-8">
        {title}
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
        {projects.map((project) => (
          <article
            key={project.id}
            className="rounded-xl overflow-hidden bg-gray-100 shadow-sm"
          >
            <div className="aspect-[4/3] bg-gray-200 overflow-hidden">
              {project.href ? (
                <a href={project.href} className="block h-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brandip-accent">
                  <img
                    src={project.image}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </a>
              ) : (
                <img
                  src={project.image}
                  alt=""
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            <div className="px-4 py-4 bg-gray-100 text-center">
              <h3 className="text-lg font-semibold text-[#1A1A1A]">
                {project.href ? (
                  <a href={project.href} className="hover:text-brandip-accent transition-colors">
                    {project.title}
                  </a>
                ) : (
                  project.title
                )}
              </h3>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
