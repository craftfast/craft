/**
 * Admin AI Models Management Page
 *
 * View AI model configurations and usage statistics
 */

"use client";

import { useState, useEffect } from "react";
import {
  Cpu,
  RefreshCw,
  TrendingUp,
  DollarSign,
  Users,
  Zap,
  Brain,
  Image as ImageIcon,
  Video,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface ModelStats {
  id: string;
  name: string;
  displayName: string;
  provider: string;
  tier: string;
  description: string;
  useCase: string;
  capabilities: {
    maxContextLength?: number;
    supportsStreaming: boolean;
    supportsFunctionCalling: boolean;
    supportsJsonMode: boolean;
    supportsWebSearch: boolean;
  };
  pricing?: {
    inputTokens: number;
    outputTokens: number;
  };
  stats: {
    totalCalls: number;
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    totalCost: number;
    usersPreferring: number;
  };
}

interface Totals {
  totalCalls: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCost: number;
}

export default function AdminModelsPage() {
  const [models, setModels] = useState<ModelStats[]>([]);
  const [totals, setTotals] = useState<Totals>({
    totalCalls: 0,
    totalInputTokens: 0,
    totalOutputTokens: 0,
    totalCost: 0,
  });
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("30d");

  const fetchModels = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/models?period=${period}`);
      const data = await response.json();

      if (response.ok) {
        setModels(data.models);
        setTotals(data.totals);
      } else {
        toast.error(data.error || "Failed to fetch models");
      }
    } catch (error) {
      console.error("Error fetching models:", error);
      toast.error("Failed to fetch models");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModels();
  }, [period]);

  const getUseCaseIcon = (useCase: string) => {
    switch (useCase) {
      case "coding":
        return <Cpu className="h-5 w-5" />;
      case "orchestrator":
      case "memory":
        return <Brain className="h-5 w-5" />;
      case "image-generation":
        return <ImageIcon className="h-5 w-5" />;
      case "video-generation":
        return <Video className="h-5 w-5" />;
      default:
        return <Zap className="h-5 w-5" />;
    }
  };

  const getProviderColor = (provider: string) => {
    switch (provider) {
      case "anthropic":
        return "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300";
      case "openai":
        return "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300";
      case "google":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300";
      case "x-ai":
        return "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300";
      default:
        return "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300";
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
            AI Models
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-1">
            View model configurations and usage statistics
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[140px] rounded-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="1d">Last 24 hours</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={fetchModels}
            variant="outline"
            className="rounded-full"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="rounded-2xl border-neutral-200 dark:border-neutral-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-neutral-500">
              Total API Calls
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {formatNumber(totals.totalCalls)}
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-neutral-200 dark:border-neutral-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-neutral-500">
              Input Tokens
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {formatNumber(totals.totalInputTokens)}
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-neutral-200 dark:border-neutral-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-neutral-500">
              Output Tokens
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {formatNumber(totals.totalOutputTokens)}
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-neutral-200 dark:border-neutral-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-neutral-500">
              Total Cost
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              ${totals.totalCost.toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Models Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {loading
          ? [...Array(6)].map((_, i) => (
              <Card
                key={i}
                className="rounded-2xl animate-pulse h-64 bg-neutral-100 dark:bg-neutral-900"
              />
            ))
          : models.map((model) => (
              <Card
                key={model.id}
                className="rounded-2xl border-neutral-200 dark:border-neutral-800"
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-10 w-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                        {getUseCaseIcon(model.useCase)}
                      </div>
                      <div>
                        <CardTitle className="text-base">
                          {model.displayName}
                        </CardTitle>
                        <CardDescription className="text-xs">
                          {model.id}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge
                      className={`rounded-full text-xs ${getProviderColor(
                        model.provider
                      )}`}
                    >
                      {model.provider}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-neutral-500 mb-4">
                    {model.description}
                  </p>

                  {/* Capabilities */}
                  <div className="flex flex-wrap gap-1 mb-4">
                    <Badge variant="outline" className="rounded-full text-xs">
                      {model.tier}
                    </Badge>
                    {model.capabilities.maxContextLength && (
                      <Badge variant="outline" className="rounded-full text-xs">
                        {formatNumber(model.capabilities.maxContextLength)} ctx
                      </Badge>
                    )}
                    {model.capabilities.supportsFunctionCalling && (
                      <Badge variant="outline" className="rounded-full text-xs">
                        Tools
                      </Badge>
                    )}
                    {model.capabilities.supportsWebSearch && (
                      <Badge variant="outline" className="rounded-full text-xs">
                        Web
                      </Badge>
                    )}
                  </div>

                  {/* Pricing */}
                  {model.pricing && (
                    <div className="text-xs text-neutral-500 mb-4">
                      <span className="font-medium">Pricing:</span> $
                      {model.pricing.inputTokens}/1M in, $
                      {model.pricing.outputTokens}/1M out
                    </div>
                  )}

                  {/* Usage Stats */}
                  <div className="grid grid-cols-3 gap-2 rounded-xl bg-neutral-50 dark:bg-neutral-900 p-3">
                    <div className="text-center">
                      <div className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                        {formatNumber(model.stats.totalCalls)}
                      </div>
                      <div className="text-xs text-neutral-500">Calls</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                        ${model.stats.totalCost.toFixed(2)}
                      </div>
                      <div className="text-xs text-neutral-500">Cost</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                        {model.stats.usersPreferring}
                      </div>
                      <div className="text-xs text-neutral-500">Users</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
      </div>

      {/* Usage by Use Case */}
      <Card className="rounded-2xl border-neutral-200 dark:border-neutral-800">
        <CardHeader>
          <CardTitle>Usage by Use Case</CardTitle>
          <CardDescription>
            Model usage breakdown by primary function
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            {[
              "coding",
              "orchestrator",
              "image-generation",
              "video-generation",
            ].map((useCase) => {
              const useCaseModels = models.filter((m) => m.useCase === useCase);
              const totalCalls = useCaseModels.reduce(
                (sum, m) => sum + m.stats.totalCalls,
                0
              );
              const totalCost = useCaseModels.reduce(
                (sum, m) => sum + m.stats.totalCost,
                0
              );

              return (
                <div
                  key={useCase}
                  className="rounded-xl bg-neutral-50 dark:bg-neutral-900 p-4"
                >
                  <div className="flex items-center gap-2 mb-2">
                    {getUseCaseIcon(useCase)}
                    <span className="font-medium capitalize">
                      {useCase.replace("-", " ")}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-neutral-500">Calls</span>
                      <span className="font-medium">
                        {formatNumber(totalCalls)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-neutral-500">Cost</span>
                      <span className="font-medium">
                        ${totalCost.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-neutral-500">Models</span>
                      <span className="font-medium">
                        {useCaseModels.length}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
