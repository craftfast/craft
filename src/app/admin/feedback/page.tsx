/**
 * Admin Feedback Management Page
 *
 * View and manage user feedback submissions
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import {
  RefreshCw,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Minus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Mail,
  User,
  Calendar,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface Feedback {
  id: string;
  userId: string | null;
  email: string | null;
  name: string | null;
  message: string;
  sentiment: string | null;
  createdAt: string;
}

interface FeedbackStats {
  total: number;
  positive: number;
  negative: number;
  neutral: number;
}

export default function AdminFeedbackPage() {
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [stats, setStats] = useState<FeedbackStats>({
    total: 0,
    positive: 0,
    negative: 0,
    neutral: 0,
  });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sentimentFilter, setSentimentFilter] = useState("all");
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(
    null
  );
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const fetchFeedback = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
      });
      if (sentimentFilter !== "all") {
        params.set("sentiment", sentimentFilter);
      }

      const response = await fetch(`/api/admin/feedback?${params}`);
      const data = await response.json();

      if (response.ok) {
        setFeedback(data.feedback);
        setStats(data.stats);
        setTotalPages(data.pagination.totalPages);
      } else {
        toast.error(data.error || "Failed to fetch feedback");
      }
    } catch (error) {
      console.error("Error fetching feedback:", error);
      toast.error("Failed to fetch feedback");
    } finally {
      setLoading(false);
    }
  }, [page, sentimentFilter]);

  useEffect(() => {
    fetchFeedback();
  }, [fetchFeedback]);

  const handleDelete = async () => {
    if (!selectedFeedback) return;

    try {
      const response = await fetch(
        `/api/admin/feedback/${selectedFeedback.id}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        toast.success("Feedback deleted successfully");
        setDeleteDialogOpen(false);
        setSelectedFeedback(null);
        fetchFeedback();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to delete feedback");
      }
    } catch (error) {
      console.error("Error deleting feedback:", error);
      toast.error("Failed to delete feedback");
    }
  };

  const getSentimentIcon = (sentiment: string | null) => {
    switch (sentiment) {
      case "positive":
        return (
          <ThumbsUp className="h-4 w-4 text-green-600 dark:text-green-400" />
        );
      case "negative":
        return (
          <ThumbsDown className="h-4 w-4 text-red-600 dark:text-red-400" />
        );
      default:
        return <Minus className="h-4 w-4 text-neutral-500" />;
    }
  };

  const getSentimentBadge = (sentiment: string | null) => {
    switch (sentiment) {
      case "positive":
        return (
          <Badge className="rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
            Positive
          </Badge>
        );
      case "negative":
        return (
          <Badge className="rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">
            Negative
          </Badge>
        );
      default:
        return (
          <Badge className="rounded-full bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
            Neutral
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
            Feedback
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-1">
            User feedback and suggestions
          </p>
        </div>
        <Button
          onClick={fetchFeedback}
          variant="outline"
          className="rounded-full"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="rounded-2xl border-neutral-200 dark:border-neutral-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-neutral-500 flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Total Feedback
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-neutral-200 dark:border-neutral-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-neutral-500 flex items-center gap-2">
              <ThumbsUp className="h-4 w-4" />
              Positive
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">
              {stats.positive}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-neutral-200 dark:border-neutral-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-neutral-500 flex items-center gap-2">
              <ThumbsDown className="h-4 w-4" />
              Negative
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600 dark:text-red-400">
              {stats.negative}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-neutral-200 dark:border-neutral-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-neutral-500 flex items-center gap-2">
              <Minus className="h-4 w-4" />
              Neutral
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.neutral}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="rounded-2xl border-neutral-200 dark:border-neutral-800">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Select
              value={sentimentFilter}
              onValueChange={(value) => {
                setSentimentFilter(value);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[180px] rounded-full">
                <SelectValue placeholder="Filter by sentiment" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all">All Feedback</SelectItem>
                <SelectItem value="positive">Positive</SelectItem>
                <SelectItem value="negative">Negative</SelectItem>
                <SelectItem value="neutral">Neutral</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Feedback List */}
      <div className="space-y-4">
        {loading ? (
          [...Array(5)].map((_, i) => (
            <Card
              key={i}
              className="rounded-2xl animate-pulse h-32 bg-neutral-100 dark:bg-neutral-900"
            />
          ))
        ) : feedback.length === 0 ? (
          <Card className="rounded-2xl border-neutral-200 dark:border-neutral-800">
            <CardContent className="py-12 text-center text-neutral-500">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No feedback found</p>
            </CardContent>
          </Card>
        ) : (
          feedback.map((item) => (
            <Card
              key={item.id}
              className="rounded-2xl border-neutral-200 dark:border-neutral-800"
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getSentimentIcon(item.sentiment)}
                    <div>
                      <div className="flex items-center gap-2">
                        {item.name ? (
                          <span className="font-medium text-neutral-900 dark:text-neutral-100">
                            {item.name}
                          </span>
                        ) : (
                          <span className="text-neutral-500">Anonymous</span>
                        )}
                        {getSentimentBadge(item.sentiment)}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-neutral-500">
                        {item.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {item.email}
                          </span>
                        )}
                        {item.userId && (
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            User ID: {item.userId.slice(0, 8)}...
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(item.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-full text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                    onClick={() => {
                      setSelectedFeedback(item);
                      setDeleteDialogOpen(true);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap">
                  {item.message}
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-neutral-500">
            Page {page} of {totalPages}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p - 1)}
              disabled={page === 1}
              className="rounded-full"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={page === totalPages}
              className="rounded-full"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Delete Feedback</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this feedback? This action cannot
              be undone.
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
              onClick={handleDelete}
              className="rounded-full"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
