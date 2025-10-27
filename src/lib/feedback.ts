/**
 * Feedback Management Utility
 * Provides functions to analyze and manage user feedback
 */

import { prisma } from "@/lib/db";

export interface FeedbackStats {
    total: number;
    positive: number;
    neutral: number;
    negative: number;
    withSentiment: number;
    withoutSentiment: number;
}

export interface FeedbackItem {
    id: string;
    userId: string | null;
    email: string | null;
    name: string | null;
    message: string;
    sentiment: string | null;
    createdAt: Date;
}

/**
 * Get feedback statistics
 */
export async function getFeedbackStats(): Promise<FeedbackStats> {
    const [total, positive, neutral, negative, withSentiment] = await Promise.all([
        prisma.feedback.count(),
        prisma.feedback.count({ where: { sentiment: "positive" } }),
        prisma.feedback.count({ where: { sentiment: "neutral" } }),
        prisma.feedback.count({ where: { sentiment: "negative" } }),
        prisma.feedback.count({ where: { sentiment: { not: null } } }),
    ]);

    return {
        total,
        positive,
        neutral,
        negative,
        withSentiment,
        withoutSentiment: total - withSentiment,
    };
}

/**
 * Get recent feedback
 */
export async function getRecentFeedback(
    limit: number = 10
): Promise<FeedbackItem[]> {
    return await prisma.feedback.findMany({
        orderBy: {
            createdAt: "desc",
        },
        take: limit,
    });
}

/**
 * Get feedback by sentiment
 */
export async function getFeedbackBySentiment(
    sentiment: "positive" | "neutral" | "negative",
    limit: number = 10
): Promise<FeedbackItem[]> {
    return await prisma.feedback.findMany({
        where: {
            sentiment,
        },
        orderBy: {
            createdAt: "desc",
        },
        take: limit,
    });
}

/**
 * Get feedback by user
 */
export async function getFeedbackByUser(
    userId: string
): Promise<FeedbackItem[]> {
    return await prisma.feedback.findMany({
        where: {
            userId,
        },
        orderBy: {
            createdAt: "desc",
        },
    });
}

/**
 * Get feedback in date range
 */
export async function getFeedbackByDateRange(
    startDate: Date,
    endDate: Date
): Promise<FeedbackItem[]> {
    return await prisma.feedback.findMany({
        where: {
            createdAt: {
                gte: startDate,
                lte: endDate,
            },
        },
        orderBy: {
            createdAt: "desc",
        },
    });
}

/**
 * Search feedback by message content
 */
export async function searchFeedback(
    searchTerm: string,
    limit: number = 50
): Promise<FeedbackItem[]> {
    return await prisma.feedback.findMany({
        where: {
            message: {
                contains: searchTerm,
                mode: "insensitive",
            },
        },
        orderBy: {
            createdAt: "desc",
        },
        take: limit,
    });
}
