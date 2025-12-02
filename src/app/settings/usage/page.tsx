"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { UsageTab } from "@/components/settings";

interface CreditUsageRecord {
  id: string;
  projectId: string;
  projectName: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  costUsd: number;
  creditsUsed: number;
  callType: "agent" | "chat" | "edit";
  endpoint: string;
  createdAt: string;
}

interface CreditUsageData {
  records: CreditUsageRecord[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
  };
  filters: {
    projects: Array<{ id: string; name: string }>;
    endpoints: string[];
  };
}

export default function UsageSettingsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [creditUsageData, setCreditUsageData] =
    useState<CreditUsageData | null>(null);
  const [isLoadingUsage, setIsLoadingUsage] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // Initialize from URL params
  useEffect(() => {
    const project = searchParams.get("project");
    const endpoint = searchParams.get("endpoint");
    const page = searchParams.get("page");

    if (project) setSelectedProject(project);
    if (endpoint) setSelectedEndpoint(endpoint);
    if (page) setCurrentPage(parseInt(page, 10));
  }, [searchParams]);

  // Fetch usage data
  useEffect(() => {
    fetchCreditUsage();
  }, [currentPage, selectedProject, selectedEndpoint, startDate, endDate]);

  const fetchCreditUsage = () => {
    setIsLoadingUsage(true);

    const params = new URLSearchParams({
      page: currentPage.toString(),
      limit: "10",
    });

    if (selectedProject) params.append("projectId", selectedProject);
    if (selectedEndpoint) params.append("endpoint", selectedEndpoint);
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);

    fetch(`/api/usage/credits?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (data && data.records && data.pagination && data.filters) {
          setCreditUsageData(data);
        } else {
          setCreditUsageData(null);
        }
        setIsLoadingUsage(false);
      })
      .catch((error) => {
        console.error("Error fetching usage:", error);
        setCreditUsageData(null);
        setIsLoadingUsage(false);
      });
  };

  const resetFilters = () => {
    setSelectedProject("");
    setSelectedEndpoint("");
    setStartDate("");
    setEndDate("");
    setCurrentPage(1);
  };

  const updateUrlParams = (params: {
    project?: string;
    endpoint?: string;
    page?: number;
  }) => {
    if (typeof window === "undefined") return;

    const url = new URL(window.location.href);

    if (params.project !== undefined) {
      if (params.project === "") {
        url.searchParams.delete("project");
      } else {
        url.searchParams.set("project", params.project);
      }
    }

    if (params.endpoint !== undefined) {
      if (params.endpoint === "") {
        url.searchParams.delete("endpoint");
      } else {
        url.searchParams.set("endpoint", params.endpoint);
      }
    }

    if (params.page !== undefined) {
      if (params.page === 1) {
        url.searchParams.delete("page");
      } else {
        url.searchParams.set("page", params.page.toString());
      }
    }

    router.replace(url.pathname + url.search);
  };

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-border">
        <h2 className="text-2xl font-semibold">Usage</h2>
      </div>
      <UsageTab
        creditUsageData={creditUsageData}
        isLoadingUsage={isLoadingUsage}
        selectedProject={selectedProject}
        setSelectedProject={setSelectedProject}
        selectedEndpoint={selectedEndpoint}
        setSelectedEndpoint={setSelectedEndpoint}
        startDate={startDate}
        setStartDate={setStartDate}
        endDate={endDate}
        setEndDate={setEndDate}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        updateUrlParams={updateUrlParams}
        resetFilters={resetFilters}
      />
    </div>
  );
}
