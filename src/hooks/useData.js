import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabase";

/**
 * 获取所有项目（含颜色数量统计）
 */
export function useProjects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("projects")
      .select(`
        *,
        colors(id),
        project_images(id, image_url, sort_order, caption)
      `)
      .order("year", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching projects:", error);
    } else {
      setProjects(data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  return { projects, loading, refetch: fetchProjects };
}

/**
 * 获取单个项目的完整详情（含颜色和易混淆关系）
 */
export function useProjectDetail(projectId) {
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDetail = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);

    const { data, error } = await supabase
      .from("projects")
      .select(`
        *,
        project_images(id, image_url, sort_order, caption),
        colors(
          *,
          color_confusions(id, confused_color_name)
        )
      `)
      .eq("id", projectId)
      .single();

    if (error) {
      console.error("Error fetching project detail:", error);
    } else {
      setProject(data);
    }
    setLoading(false);
  }, [projectId]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  return { project, loading, refetch: fetchDetail };
}

/**
 * 获取导出历史记录
 */
export function useExportLogs() {
  const [logs, setLogs] = useState([]);

  const fetchLogs = useCallback(async () => {
    const { data, error } = await supabase
      .from("export_logs")
      .select("*")
      .order("exported_at", { ascending: false })
      .limit(20);

    if (error) {
      console.error("Error fetching export logs:", error);
    } else {
      setLogs(data || []);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return { logs, refetch: fetchLogs };
}

/**
 * 插入导出记录
 */
export async function insertExportLog({ orderNo, projectName, colorCount, exportedBy }) {
  const { error } = await supabase.from("export_logs").insert({
    order_no: orderNo,
    project_name: projectName,
    color_count: colorCount,
    exported_by: exportedBy,
  });
  if (error) console.error("Error inserting export log:", error);
  return !error;
}
