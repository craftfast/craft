/**
 * Admin AI Models Management Page
 *
 * Full CRUD management for AI model configurations
 * - View all models with usage statistics
 * - Create new models
 * - Edit existing models
 * - Enable/disable models
 * - Set default models per use case
 * - Sync/seed from fallback config
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Cpu,
  RefreshCw,
  Plus,
  Edit,
  Trash2,
  Power,
  PowerOff,
  Star,
  Settings,
  Database,
  Brain,
  Image as ImageIcon,
  Video,
  Zap,
  Check,
  X,
  AlertTriangle,
  Download,
  Upload,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

// Types
interface ModelPricing {
  inputTokens: number;
  outputTokens: number;
  longContextThreshold?: number | null;
  inputTokensLongContext?: number | null;
  outputTokensLongContext?: number | null;
  cacheCreation?: number | null;
  cacheRead?: number | null;
  cacheCreationLongContext?: number | null;
  cacheReadLongContext?: number | null;
  cacheDuration?: string | null;
  imageInputTokens?: number | null;
  audioInputTokens?: number | null;
  videoInputTokens?: number | null;
  audioOutputTokens?: number | null;
  images?: number | null;
  videoSeconds?: number | null;
  webSearchFreePerDay?: number | null;
  webSearch?: number | null;
  mapsGroundingFreePerDay?: number | null;
  mapsGrounding?: number | null;
  pricingNotes?: string | null;
}

interface ModelCapabilities {
  supportedInputs: string[];
  supportedOutputs: string[];
  maxContextLength?: number | null;
  supportsStreaming: boolean;
  supportsSystemPrompts: boolean;
  supportsWebSearch: boolean;
  supportsFunctionCalling: boolean;
  supportsJsonMode: boolean;
}

interface ModelStats {
  totalCalls: number;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  totalCost: number;
  usersPreferring: number;
}

interface AIModel {
  id: string;
  name: string;
  displayName: string;
  provider: string;
  tier: string;
  description: string;
  useCase: string;
  isEnabled: boolean;
  isDefault: boolean;
  isSystem: boolean;
  sortOrder: number;
  capabilities: ModelCapabilities | null;
  pricing: ModelPricing | null;
  stats: ModelStats;
  createdAt: string | null;
  updatedAt: string | null;
}

interface Totals {
  totalModels: number;
  enabledModels: number;
  totalCalls: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCost: number;
}

interface DefaultModel {
  useCase: string;
  modelId: string;
  displayName?: string;
}

// Initial empty model for creation
const emptyModel: Partial<AIModel> = {
  id: "",
  name: "",
  displayName: "",
  provider: "anthropic",
  tier: "fast",
  description: "",
  useCase: "coding",
  isEnabled: true,
  isDefault: false,
  isSystem: false,
  sortOrder: 0,
  capabilities: {
    supportedInputs: ["text"],
    supportedOutputs: ["text", "code"],
    maxContextLength: 200000,
    supportsStreaming: true,
    supportsSystemPrompts: true,
    supportsWebSearch: false,
    supportsFunctionCalling: true,
    supportsJsonMode: true,
  },
  pricing: {
    inputTokens: 1.0,
    outputTokens: 5.0,
  },
};

export default function AdminModelsPage() {
  // State
  const [models, setModels] = useState<AIModel[]>([]);
  const [totals, setTotals] = useState<Totals>({
    totalModels: 0,
    enabledModels: 0,
    totalCalls: 0,
    totalInputTokens: 0,
    totalOutputTokens: 0,
    totalCost: 0,
  });
  const [defaults, setDefaults] = useState<DefaultModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("30d");
  const [isFromDatabase, setIsFromDatabase] = useState(false);

  // Dialog states
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [syncDialogOpen, setSyncDialogOpen] = useState(false);
  const [defaultDialogOpen, setDefaultDialogOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState<AIModel | null>(null);
  const [editingModel, setEditingModel] =
    useState<Partial<AIModel>>(emptyModel);
  const [isCreating, setIsCreating] = useState(false);

  // Filters
  const [filterUseCase, setFilterUseCase] = useState<string>("all");
  const [filterProvider, setFilterProvider] = useState<string>("all");

  // Fetch models
  const fetchModels = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ period, includeDisabled: "true" });
      if (filterUseCase !== "all") params.set("useCase", filterUseCase);
      if (filterProvider !== "all") params.set("provider", filterProvider);

      const response = await fetch(`/api/admin/ai-models?${params}`);
      const data = await response.json();

      if (response.ok) {
        setModels(data.models);
        setTotals(data.totals);
        setDefaults(data.defaults || []);
        setIsFromDatabase(data.isFromDatabase);
      } else {
        toast.error(data.error || "Failed to fetch models");
      }
    } catch (error) {
      console.error("Error fetching models:", error);
      toast.error("Failed to fetch models");
    } finally {
      setLoading(false);
    }
  }, [period, filterUseCase, filterProvider]);

  useEffect(() => {
    fetchModels();
  }, [fetchModels]);

  // Create/Update model
  const handleSaveModel = async () => {
    try {
      const url = isCreating
        ? "/api/admin/ai-models"
        : `/api/admin/ai-models/${encodeURIComponent(editingModel.id!)}`;

      const response = await fetch(url, {
        method: isCreating ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingModel),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(
          isCreating
            ? "Model created successfully"
            : "Model updated successfully"
        );
        setEditDialogOpen(false);
        fetchModels();
      } else {
        toast.error(data.error || "Failed to save model");
      }
    } catch (error) {
      console.error("Error saving model:", error);
      toast.error("Failed to save model");
    }
  };

  // Delete model
  const handleDeleteModel = async () => {
    if (!selectedModel) return;

    try {
      const response = await fetch(
        `/api/admin/ai-models/${encodeURIComponent(selectedModel.id)}`,
        { method: "DELETE" }
      );

      const data = await response.json();

      if (response.ok) {
        toast.success("Model deleted successfully");
        setDeleteDialogOpen(false);
        fetchModels();
      } else {
        toast.error(data.error || "Failed to delete model");
      }
    } catch (error) {
      console.error("Error deleting model:", error);
      toast.error("Failed to delete model");
    }
  };

  // Toggle model enabled/disabled
  const handleToggleEnabled = async (model: AIModel) => {
    try {
      const response = await fetch(
        `/api/admin/ai-models/${encodeURIComponent(model.id)}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isEnabled: !model.isEnabled }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        toast.success(model.isEnabled ? "Model disabled" : "Model enabled");
        fetchModels();
      } else {
        toast.error(data.error || "Failed to toggle model");
      }
    } catch (error) {
      console.error("Error toggling model:", error);
      toast.error("Failed to toggle model");
    }
  };

  // Set default model
  const handleSetDefault = async (useCase: string, modelId: string) => {
    try {
      const response = await fetch("/api/admin/ai-models/defaults", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ useCase, modelId }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message);
        setDefaultDialogOpen(false);
        fetchModels();
      } else {
        toast.error(data.error || "Failed to set default");
      }
    } catch (error) {
      console.error("Error setting default:", error);
      toast.error("Failed to set default");
    }
  };

  // Sync operations
  const handleSync = async (operation: "seed" | "reset" | "refresh") => {
    try {
      const response = await fetch("/api/admin/ai-models/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ operation }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || `${operation} completed`);
        setSyncDialogOpen(false);
        fetchModels();
      } else {
        toast.error(data.error || `Failed to ${operation}`);
      }
    } catch (error) {
      console.error(`Error during ${operation}:`, error);
      toast.error(`Failed to ${operation}`);
    }
  };

  // Helpers
  const getUseCaseIcon = (useCase: string) => {
    switch (useCase) {
      case "coding":
        return <Cpu className="h-4 w-4" />;
      case "orchestrator":
      case "memory":
        return <Brain className="h-4 w-4" />;
      case "image-generation":
        return <ImageIcon className="h-4 w-4" />;
      case "video-generation":
        return <Video className="h-4 w-4" />;
      default:
        return <Zap className="h-4 w-4" />;
    }
  };

  const getProviderColor = (provider: string) => {
    switch (provider) {
      case "anthropic":
        return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300";
      case "openai":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300";
      case "google":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300";
      case "x-ai":
      case "xai":
        return "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300";
      default:
        return "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300";
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
    return num.toString();
  };

  const openCreateDialog = () => {
    setIsCreating(true);
    setEditingModel({ ...emptyModel });
    setEditDialogOpen(true);
  };

  const openEditDialog = (model: AIModel) => {
    setIsCreating(false);
    setSelectedModel(model);
    setEditingModel({ ...model });
    setEditDialogOpen(true);
  };

  const openDeleteDialog = (model: AIModel) => {
    setSelectedModel(model);
    setDeleteDialogOpen(true);
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
            Manage AI model configurations, pricing, and defaults
          </p>
        </div>
        <div className="flex items-center gap-3">
          {!isFromDatabase && (
            <Badge variant="outline" className="rounded-full">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Using Fallback Config
            </Badge>
          )}
          <Button
            onClick={() => setSyncDialogOpen(true)}
            variant="outline"
            className="rounded-full"
          >
            <Database className="h-4 w-4 mr-2" />
            Sync
          </Button>
          <Button
            onClick={() => setDefaultDialogOpen(true)}
            variant="outline"
            className="rounded-full"
          >
            <Star className="h-4 w-4 mr-2" />
            Defaults
          </Button>
          <Button onClick={openCreateDialog} className="rounded-full">
            <Plus className="h-4 w-4 mr-2" />
            Add Model
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
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

        <Select value={filterUseCase} onValueChange={setFilterUseCase}>
          <SelectTrigger className="w-40 rounded-full">
            <SelectValue placeholder="Use Case" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="all">All Use Cases</SelectItem>
            <SelectItem value="coding">Coding</SelectItem>
            <SelectItem value="orchestrator">Orchestrator</SelectItem>
            <SelectItem value="memory">Memory</SelectItem>
            <SelectItem value="image-generation">Image Gen</SelectItem>
            <SelectItem value="video-generation">Video Gen</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterProvider} onValueChange={setFilterProvider}>
          <SelectTrigger className="w-[140px] rounded-full">
            <SelectValue placeholder="Provider" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="all">All Providers</SelectItem>
            <SelectItem value="anthropic">Anthropic</SelectItem>
            <SelectItem value="openai">OpenAI</SelectItem>
            <SelectItem value="google">Google</SelectItem>
            <SelectItem value="x-ai">X.AI</SelectItem>
            <SelectItem value="openrouter">OpenRouter</SelectItem>
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

      {/* Stats Summary */}
      <div className="grid gap-4 md:grid-cols-6">
        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-neutral-500">
              Models
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.totalModels}</div>
            <div className="text-xs text-neutral-500">
              {totals.enabledModels} enabled
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-neutral-500">
              API Calls
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(totals.totalCalls)}
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-neutral-500">
              Input Tokens
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(totals.totalInputTokens)}
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-neutral-500">
              Output Tokens
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(totals.totalOutputTokens)}
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-neutral-500">
              Total Cost
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${totals.totalCost.toFixed(2)}
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-neutral-500">
              Source
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {isFromDatabase ? (
                <>
                  <Database className="h-5 w-5 text-green-500" />
                  <span className="text-sm font-medium">Database</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  <span className="text-sm font-medium">Fallback</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Models Table */}
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>All Models</CardTitle>
          <CardDescription>
            Click on a model to edit, or use the actions menu
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Model</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Use Case</TableHead>
                <TableHead>Tier</TableHead>
                <TableHead>Pricing</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Usage</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={8}>
                      <div className="h-12 bg-neutral-100 dark:bg-neutral-800 animate-pulse rounded" />
                    </TableCell>
                  </TableRow>
                ))
              ) : models.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center py-8 text-neutral-500"
                  >
                    No models found. Click &quot;Sync&quot; to seed from
                    fallback config.
                  </TableCell>
                </TableRow>
              ) : (
                models.map((model) => (
                  <TableRow
                    key={model.id}
                    className="cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-900"
                    onClick={() => openEditDialog(model)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                          {getUseCaseIcon(model.useCase)}
                        </div>
                        <div>
                          <div className="font-medium flex items-center gap-2">
                            {model.displayName}
                            {model.isDefault && (
                              <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                            )}
                            {model.isSystem && (
                              <Badge
                                variant="outline"
                                className="text-xs rounded-full"
                              >
                                System
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs text-neutral-500">
                            {model.id}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={`rounded-full ${getProviderColor(
                          model.provider
                        )}`}
                      >
                        {model.provider}
                      </Badge>
                    </TableCell>
                    <TableCell className="capitalize">
                      {model.useCase.replace("-", " ")}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="rounded-full capitalize"
                      >
                        {model.tier}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {model.pricing ? (
                        <div className="text-sm">
                          <div>${model.pricing.inputTokens}/1M in</div>
                          <div>${model.pricing.outputTokens}/1M out</div>
                        </div>
                      ) : (
                        <span className="text-neutral-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {model.isEnabled ? (
                        <Badge className="rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                          <Check className="h-3 w-3 mr-1" /> Enabled
                        </Badge>
                      ) : (
                        <Badge className="rounded-full bg-neutral-100 text-neutral-500 dark:bg-neutral-800">
                          <X className="h-3 w-3 mr-1" /> Disabled
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{formatNumber(model.stats.totalCalls)} calls</div>
                        <div className="text-neutral-500">
                          ${model.stats.totalCost.toFixed(2)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          asChild
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button
                            variant="ghost"
                            size="sm"
                            className="rounded-full"
                          >
                            <Settings className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditDialog(model);
                            }}
                          >
                            <Edit className="h-4 w-4 mr-2" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleEnabled(model);
                            }}
                          >
                            {model.isEnabled ? (
                              <>
                                <PowerOff className="h-4 w-4 mr-2" /> Disable
                              </>
                            ) : (
                              <>
                                <Power className="h-4 w-4 mr-2" /> Enable
                              </>
                            )}
                          </DropdownMenuItem>
                          {!model.isDefault && model.isEnabled && (
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSetDefault(model.useCase, model.id);
                              }}
                            >
                              <Star className="h-4 w-4 mr-2" /> Set as Default
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={(e) => {
                              e.stopPropagation();
                              openDeleteDialog(model);
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit/Create Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle>
              {isCreating ? "Add New Model" : "Edit Model"}
            </DialogTitle>
            <DialogDescription>
              {isCreating
                ? "Add a new AI model to the system"
                : `Editing ${selectedModel?.displayName}`}
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="basic" className="mt-4">
            <TabsList className="rounded-full">
              <TabsTrigger value="basic" className="rounded-full">
                Basic
              </TabsTrigger>
              <TabsTrigger value="capabilities" className="rounded-full">
                Capabilities
              </TabsTrigger>
              <TabsTrigger value="pricing" className="rounded-full">
                Pricing
              </TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 mt-4">
              {isCreating && (
                <div className="space-y-2">
                  <Label>Model ID</Label>
                  <Input
                    placeholder="provider/model-name"
                    value={editingModel.id || ""}
                    onChange={(e) =>
                      setEditingModel({ ...editingModel, id: e.target.value })
                    }
                    className="rounded-full"
                  />
                  <p className="text-xs text-neutral-500">
                    Format: provider/model-name (e.g., anthropic/claude-4)
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>API Name</Label>
                  <Input
                    placeholder="claude-4"
                    value={editingModel.name || ""}
                    onChange={(e) =>
                      setEditingModel({ ...editingModel, name: e.target.value })
                    }
                    className="rounded-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Display Name</Label>
                  <Input
                    placeholder="Claude 4"
                    value={editingModel.displayName || ""}
                    onChange={(e) =>
                      setEditingModel({
                        ...editingModel,
                        displayName: e.target.value,
                      })
                    }
                    className="rounded-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Provider</Label>
                  <Select
                    value={editingModel.provider}
                    onValueChange={(v) =>
                      setEditingModel({ ...editingModel, provider: v })
                    }
                  >
                    <SelectTrigger className="rounded-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="anthropic">Anthropic</SelectItem>
                      <SelectItem value="openai">OpenAI</SelectItem>
                      <SelectItem value="google">Google</SelectItem>
                      <SelectItem value="x-ai">X.AI</SelectItem>
                      <SelectItem value="openrouter">OpenRouter</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Use Case</Label>
                  <Select
                    value={editingModel.useCase}
                    onValueChange={(v) =>
                      setEditingModel({ ...editingModel, useCase: v })
                    }
                  >
                    <SelectTrigger className="rounded-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="coding">Coding</SelectItem>
                      <SelectItem value="orchestrator">Orchestrator</SelectItem>
                      <SelectItem value="memory">Memory</SelectItem>
                      <SelectItem value="image-generation">
                        Image Generation
                      </SelectItem>
                      <SelectItem value="video-generation">
                        Video Generation
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tier</Label>
                  <Select
                    value={editingModel.tier}
                    onValueChange={(v) =>
                      setEditingModel({ ...editingModel, tier: v })
                    }
                  >
                    <SelectTrigger className="rounded-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="fast">Fast</SelectItem>
                      <SelectItem value="expert">Expert</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Sort Order</Label>
                  <Input
                    type="number"
                    value={editingModel.sortOrder || 0}
                    onChange={(e) =>
                      setEditingModel({
                        ...editingModel,
                        sortOrder: parseInt(e.target.value),
                      })
                    }
                    className="rounded-full"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  placeholder="Model description..."
                  value={editingModel.description || ""}
                  onChange={(e) =>
                    setEditingModel({
                      ...editingModel,
                      description: e.target.value,
                    })
                  }
                  className="rounded-xl"
                />
              </div>

              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={editingModel.isEnabled ?? true}
                    onCheckedChange={(v) =>
                      setEditingModel({ ...editingModel, isEnabled: v })
                    }
                  />
                  <Label>Enabled</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={editingModel.isDefault ?? false}
                    onCheckedChange={(v) =>
                      setEditingModel({ ...editingModel, isDefault: v })
                    }
                  />
                  <Label>Default</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={editingModel.isSystem ?? false}
                    onCheckedChange={(v) =>
                      setEditingModel({ ...editingModel, isSystem: v })
                    }
                  />
                  <Label>System</Label>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="capabilities" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Max Context Length</Label>
                <Input
                  type="number"
                  value={editingModel.capabilities?.maxContextLength || ""}
                  onChange={(e) =>
                    setEditingModel({
                      ...editingModel,
                      capabilities: {
                        ...editingModel.capabilities!,
                        maxContextLength: parseInt(e.target.value) || null,
                      },
                    })
                  }
                  className="rounded-full"
                  placeholder="200000"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={
                      editingModel.capabilities?.supportsStreaming ?? true
                    }
                    onCheckedChange={(v) =>
                      setEditingModel({
                        ...editingModel,
                        capabilities: {
                          ...editingModel.capabilities!,
                          supportsStreaming: v,
                        },
                      })
                    }
                  />
                  <Label>Supports Streaming</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={
                      editingModel.capabilities?.supportsSystemPrompts ?? true
                    }
                    onCheckedChange={(v) =>
                      setEditingModel({
                        ...editingModel,
                        capabilities: {
                          ...editingModel.capabilities!,
                          supportsSystemPrompts: v,
                        },
                      })
                    }
                  />
                  <Label>System Prompts</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={
                      editingModel.capabilities?.supportsWebSearch ?? false
                    }
                    onCheckedChange={(v) =>
                      setEditingModel({
                        ...editingModel,
                        capabilities: {
                          ...editingModel.capabilities!,
                          supportsWebSearch: v,
                        },
                      })
                    }
                  />
                  <Label>Web Search</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={
                      editingModel.capabilities?.supportsFunctionCalling ?? true
                    }
                    onCheckedChange={(v) =>
                      setEditingModel({
                        ...editingModel,
                        capabilities: {
                          ...editingModel.capabilities!,
                          supportsFunctionCalling: v,
                        },
                      })
                    }
                  />
                  <Label>Function Calling</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={
                      editingModel.capabilities?.supportsJsonMode ?? true
                    }
                    onCheckedChange={(v) =>
                      setEditingModel({
                        ...editingModel,
                        capabilities: {
                          ...editingModel.capabilities!,
                          supportsJsonMode: v,
                        },
                      })
                    }
                  />
                  <Label>JSON Mode</Label>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="pricing" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Input Tokens ($ per 1M)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={editingModel.pricing?.inputTokens ?? ""}
                    onChange={(e) =>
                      setEditingModel({
                        ...editingModel,
                        pricing: {
                          ...editingModel.pricing!,
                          inputTokens: parseFloat(e.target.value) || 0,
                          outputTokens: editingModel.pricing?.outputTokens ?? 0,
                        },
                      })
                    }
                    className="rounded-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Output Tokens ($ per 1M)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={editingModel.pricing?.outputTokens ?? ""}
                    onChange={(e) =>
                      setEditingModel({
                        ...editingModel,
                        pricing: {
                          ...editingModel.pricing!,
                          inputTokens: editingModel.pricing?.inputTokens ?? 0,
                          outputTokens: parseFloat(e.target.value) || 0,
                        },
                      })
                    }
                    className="rounded-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Cache Read ($ per 1M)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={editingModel.pricing?.cacheRead ?? ""}
                    onChange={(e) =>
                      setEditingModel({
                        ...editingModel,
                        pricing: {
                          ...editingModel.pricing!,
                          inputTokens: editingModel.pricing?.inputTokens ?? 0,
                          outputTokens: editingModel.pricing?.outputTokens ?? 0,
                          cacheRead: parseFloat(e.target.value) || null,
                        },
                      })
                    }
                    className="rounded-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Cache Creation ($ per 1M)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={editingModel.pricing?.cacheCreation ?? ""}
                    onChange={(e) =>
                      setEditingModel({
                        ...editingModel,
                        pricing: {
                          ...editingModel.pricing!,
                          inputTokens: editingModel.pricing?.inputTokens ?? 0,
                          outputTokens: editingModel.pricing?.outputTokens ?? 0,
                          cacheCreation: parseFloat(e.target.value) || null,
                        },
                      })
                    }
                    className="rounded-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Web Search ($ per 1K)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={editingModel.pricing?.webSearch ?? ""}
                    onChange={(e) =>
                      setEditingModel({
                        ...editingModel,
                        pricing: {
                          ...editingModel.pricing!,
                          inputTokens: editingModel.pricing?.inputTokens ?? 0,
                          outputTokens: editingModel.pricing?.outputTokens ?? 0,
                          webSearch: parseFloat(e.target.value) || null,
                        },
                      })
                    }
                    className="rounded-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Images ($ per 1K)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={editingModel.pricing?.images ?? ""}
                    onChange={(e) =>
                      setEditingModel({
                        ...editingModel,
                        pricing: {
                          ...editingModel.pricing!,
                          inputTokens: editingModel.pricing?.inputTokens ?? 0,
                          outputTokens: editingModel.pricing?.outputTokens ?? 0,
                          images: parseFloat(e.target.value) || null,
                        },
                      })
                    }
                    className="rounded-full"
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6">
            <Button
              variant="outline"
              onClick={() => setEditDialogOpen(false)}
              className="rounded-full"
            >
              Cancel
            </Button>
            <Button onClick={handleSaveModel} className="rounded-full">
              {isCreating ? "Create Model" : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Delete Model</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{selectedModel?.displayName}
              &quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              className="rounded-full"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteModel}
              className="rounded-full"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sync Dialog */}
      <Dialog open={syncDialogOpen} onOpenChange={setSyncDialogOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Sync Models</DialogTitle>
            <DialogDescription>
              Sync database with fallback configuration
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Button
              variant="outline"
              className="w-full justify-start rounded-xl h-auto p-4"
              onClick={() => handleSync("seed")}
            >
              <Download className="h-5 w-5 mr-3" />
              <div className="text-left">
                <div className="font-medium">Seed Missing Models</div>
                <div className="text-sm text-neutral-500">
                  Add models from fallback config that don&apos;t exist in DB
                </div>
              </div>
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start rounded-xl h-auto p-4"
              onClick={() => handleSync("refresh")}
            >
              <RefreshCw className="h-5 w-5 mr-3" />
              <div className="text-left">
                <div className="font-medium">Refresh Cache</div>
                <div className="text-sm text-neutral-500">
                  Reload models from database into memory cache
                </div>
              </div>
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start rounded-xl h-auto p-4 border-red-200 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950"
              onClick={() => handleSync("reset")}
            >
              <Upload className="h-5 w-5 mr-3 text-red-500" />
              <div className="text-left">
                <div className="font-medium text-red-600">
                  Reset to Defaults
                </div>
                <div className="text-sm text-neutral-500">
                  Delete all models and re-seed from fallback config
                </div>
              </div>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Defaults Dialog */}
      <Dialog open={defaultDialogOpen} onOpenChange={setDefaultDialogOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Default Models</DialogTitle>
            <DialogDescription>
              Set the default model for each use case
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {[
              "coding",
              "orchestrator",
              "memory",
              "image-generation",
              "video-generation",
            ].map((useCase) => {
              const currentDefault = defaults.find(
                (d) => d.useCase === useCase
              );
              const useCaseModels = models.filter(
                (m) => m.useCase === useCase && m.isEnabled
              );

              return (
                <div
                  key={useCase}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    {getUseCaseIcon(useCase)}
                    <span className="capitalize">
                      {useCase.replace("-", " ")}
                    </span>
                  </div>
                  <Select
                    value={currentDefault?.modelId || ""}
                    onValueChange={(v) => handleSetDefault(useCase, v)}
                  >
                    <SelectTrigger className="w-[200px] rounded-full">
                      <SelectValue placeholder="Select default..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {useCaseModels.map((model) => (
                        <SelectItem key={model.id} value={model.id}>
                          {model.displayName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* Usage by Use Case */}
      <Card className="rounded-2xl border-neutral-200 dark:border-neutral-800">
        <CardHeader>
          <CardTitle>Usage by Use Case</CardTitle>
          <CardDescription>
            Model usage breakdown by primary function
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-5">
            {[
              "coding",
              "orchestrator",
              "memory",
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
                  <div className="flex items-center gap-2 mb-3">
                    {getUseCaseIcon(useCase)}
                    <span className="font-medium capitalize text-sm">
                      {useCase.replace("-", " ")}
                    </span>
                  </div>
                  <div className="space-y-2">
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
