import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Project } from "@shared/schema";
import { Trash2, FolderOpen, Clock, Loader2, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

export default function ProjectsPage() {
  const { toast } = useToast();
  const [, setLoc] = useLocation();

  const { data: projects = [], isLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/projects");
      return res.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/projects/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({ title: "Project deleted" });
    },
    onError: (e: any) => {
      toast({ title: "Delete failed", description: e.message, variant: "destructive" });
    },
  });

  return (
    <div
      className="h-full overflow-y-auto p-6"
      style={{ height: "calc(100dvh - 49px)" }}
    >
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-lg font-semibold" style={{ color: "hsl(210 20% 88%)" }}>
              Saved Projects
            </h1>
            <p className="text-sm mt-0.5" style={{ color: "hsl(210 10% 45%)" }}>
              {projects.length} project{projects.length !== 1 ? "s" : ""}
            </p>
          </div>
          <button
            onClick={() => setLoc("/")}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
            style={{ background: "hsl(185 90% 42%)", color: "hsl(220 14% 8%)" }}
            data-testid="button-new-project"
          >
            <Plus size={14} />
            New Project
          </button>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-16 gap-3" style={{ color: "hsl(210 10% 45%)" }}>
            <Loader2 size={20} className="animate-spin" />
            <span className="text-sm">Loading projects…</span>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && projects.length === 0 && (
          <div
            className="flex flex-col items-center justify-center py-20 gap-4 rounded-xl"
            style={{ background: "hsl(220 13% 10%)", border: "1px dashed hsl(220 10% 20%)" }}
          >
            <FolderOpen size={36} style={{ color: "hsl(210 10% 35%)" }} />
            <div className="text-center">
              <p className="text-sm font-medium" style={{ color: "hsl(210 15% 60%)" }}>No saved projects yet</p>
              <p className="text-xs mt-1" style={{ color: "hsl(210 10% 40%)" }}>
                Convert an image in the Editor to get started
              </p>
            </div>
            <button
              onClick={() => setLoc("/")}
              className="mt-2 px-4 py-2 rounded-md text-sm font-medium"
              style={{ background: "hsl(185 90% 42%)", color: "hsl(220 14% 8%)" }}
            >
              Open Editor
            </button>
          </div>
        )}

        {/* Project grid */}
        {!isLoading && projects.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((p) => (
              <ProjectCard
                key={p.id}
                project={p}
                onDelete={() => deleteMutation.mutate(p.id)}
                deleting={deleteMutation.isPending}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ProjectCard({
  project,
  onDelete,
  deleting,
}: {
  project: Project;
  onDelete: () => void;
  deleting: boolean;
}) {
  return (
    <div
      className="flex flex-col rounded-xl overflow-hidden transition-all hover:translate-y-[-1px]"
      style={{
        background: "hsl(220 13% 10%)",
        border: "1px solid hsl(220 10% 17%)",
        boxShadow: "0 2px 12px hsl(0 0% 0% / 0.3)",
      }}
      data-testid={`card-project-${project.id}`}
    >
      {/* Thumbnail */}
      <div
        className="relative flex items-center justify-center overflow-hidden grid-bg"
        style={{ height: 120 }}
      >
        {project.imageDataUrl ? (
          <img
            src={project.imageDataUrl}
            alt={project.name}
            className="w-full h-full object-contain"
            style={{ maxHeight: 120 }}
          />
        ) : (
          <FolderOpen size={32} style={{ color: "hsl(210 10% 30%)" }} />
        )}
        {/* Mode badge */}
        <span
          className="absolute top-2 right-2 text-xs px-1.5 py-0.5 rounded font-mono"
          style={{ background: "hsl(185 90% 42% / 0.15)", color: "hsl(185 90% 52%)" }}
        >
          {project.conversionMode}
        </span>
      </div>

      {/* Info */}
      <div className="flex flex-col gap-2 p-3">
        <h3 className="text-sm font-semibold truncate" style={{ color: "hsl(210 20% 85%)" }}>
          {project.name}
        </h3>
        <div className="flex items-center gap-2 text-xs" style={{ color: "hsl(210 10% 45%)" }}>
          <span className="font-mono">{project.scaleX}×{project.scaleY}mm</span>
          <span>·</span>
          <span>depth {project.extrusionDepth}mm</span>
        </div>
        <div className="flex items-center gap-1 text-xs" style={{ color: "hsl(210 10% 40%)" }}>
          <Clock size={11} />
          {project.updatedAt
            ? new Date(project.updatedAt).toLocaleDateString("en-GB", {
                day: "2-digit", month: "short", year: "numeric",
              })
            : "—"}
        </div>
      </div>

      {/* Actions */}
      <div
        className="flex gap-2 px-3 pb-3"
        style={{ borderTop: "1px solid hsl(220 10% 14%)", paddingTop: 10, marginTop: 2 }}
      >
        <button
          onClick={onDelete}
          disabled={deleting}
          className="flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ml-auto disabled:opacity-40"
          style={{ color: "hsl(0 72% 60%)", background: "hsl(0 72% 40% / 0.1)" }}
          data-testid={`button-delete-${project.id}`}
        >
          <Trash2 size={12} />
          Delete
        </button>
      </div>
    </div>
  );
}
