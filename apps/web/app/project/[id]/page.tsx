import { ProjectDetail } from "@/modules/projects/project-detail";

export default function ProjectPage({
  params,
}: {
  params: { id: string };
}) {
  return <ProjectDetail projectId={params.id} />;
}
