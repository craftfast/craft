"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Check, Copy, Users, Gift, TrendingUp } from "lucide-react";
import { toast } from "sonner";

interface ReferralData {
  referralCode: string | null;
  totalReferrals: number;
  totalCreditsEarned: number;
  currentMonthlyCredits: number;
  referrals: Array<{
    id: string;
    email: string | null;
    name: string | null;
    createdAt: string;
  }>;
  creditHistory?: Array<{
    month: string;
    credits: number;
    activeReferrals: number;
  }>;
}

interface ReferralsTabProps {
  referralData: ReferralData | null;
  isLoadingReferralData: boolean;
  fetchReferralData: () => Promise<void>;
}

export default function ReferralsTab({
  referralData,
  isLoadingReferralData,
  fetchReferralData,
}: ReferralsTabProps) {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);

  const generateReferralCode = async () => {
    setIsGeneratingCode(true);
    try {
      const response = await fetch("/api/referrals/generate-code", {
        method: "POST",
      });

      if (response.ok) {
        await fetchReferralData();
        toast.success("Referral code generated successfully");
      } else {
        toast.error("Failed to generate referral code");
      }
    } catch (error) {
      console.error("Failed to generate referral code:", error);
      toast.error("Failed to generate referral code");
    } finally {
      setIsGeneratingCode(false);
    }
  };

  const copyReferralLink = () => {
    if (!referralData?.referralCode) return;

    const referralLink = `${window.location.origin}/auth/signup?ref=${referralData.referralCode}`;
    navigator.clipboard.writeText(referralLink);
    setCopiedLink(true);
    toast.success("Referral link copied to clipboard");
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const copyReferralCode = () => {
    if (!referralData?.referralCode) return;

    navigator.clipboard.writeText(referralData.referralCode);
    setCopiedCode(true);
    toast.success("Referral code copied to clipboard");
    setTimeout(() => setCopiedCode(false), 2000);
  };

  if (isLoadingReferralData) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-neutral-200 dark:bg-neutral-800 rounded-2xl"></div>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="h-32 bg-neutral-200 dark:bg-neutral-800 rounded-2xl"></div>
            <div className="h-32 bg-neutral-200 dark:bg-neutral-800 rounded-2xl"></div>
            <div className="h-32 bg-neutral-200 dark:bg-neutral-800 rounded-2xl"></div>
          </div>
        </div>
      </div>
    );
  }

  const referralLink = referralData?.referralCode
    ? `${
        typeof window !== "undefined" ? window.location.origin : ""
      }/auth/signup?ref=${referralData.referralCode}`
    : "";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
          Referral Program
        </h2>
        <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
          Earn 1 free credit per month for every friend you refer
        </p>
      </div>

      {/* Referral Link Card */}
      <Card className="border-neutral-200 dark:border-neutral-800">
        <CardHeader>
          <CardTitle className="text-neutral-900 dark:text-neutral-100">
            Your Referral Link
          </CardTitle>
          <CardDescription className="text-neutral-600 dark:text-neutral-400">
            Share this link with friends to earn credits
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!referralData?.referralCode ? (
            <div className="text-center py-8">
              <Button
                onClick={generateReferralCode}
                disabled={isGeneratingCode}
                className="rounded-full h-11 px-8 bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:hover:bg-neutral-200 text-neutral-100 dark:text-neutral-900"
              >
                {isGeneratingCode ? "Generating..." : "Generate Referral Code"}
              </Button>
            </div>
          ) : (
            <>
              <div className="flex gap-2">
                <Input
                  value={referralLink}
                  readOnly
                  className="rounded-full h-11 font-mono text-sm bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800"
                />
                <Button
                  onClick={copyReferralLink}
                  variant="outline"
                  className="rounded-full h-11 px-6 gap-2 border-neutral-200 dark:border-neutral-800"
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-4 h-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy Link
                    </>
                  )}
                </Button>
              </div>
              <div className="flex gap-2 items-center">
                <span className="text-sm text-neutral-600 dark:text-neutral-400">
                  Your referral code:
                </span>
                <code className="px-3 py-1 bg-neutral-100 dark:bg-neutral-900 rounded-lg text-neutral-900 dark:text-neutral-100 font-mono">
                  {referralData.referralCode}
                </code>
                <Button
                  onClick={copyReferralCode}
                  variant="ghost"
                  size="sm"
                  className="rounded-full h-8 px-3"
                >
                  {copiedCode ? (
                    <Check className="w-3 h-3" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="border-neutral-200 dark:border-neutral-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
              Total Referrals
            </CardTitle>
            <Users className="w-4 h-4 text-neutral-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
              {referralData?.totalReferrals || 0}
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-500 mt-1">
              Friends who signed up
            </p>
          </CardContent>
        </Card>

        <Card className="border-neutral-200 dark:border-neutral-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
              Monthly Credits
            </CardTitle>
            <Gift className="w-4 h-4 text-neutral-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
              +{referralData?.currentMonthlyCredits || 0}
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-500 mt-1">
              Extra credits per month
            </p>
          </CardContent>
        </Card>

        <Card className="border-neutral-200 dark:border-neutral-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
              Total Earned
            </CardTitle>
            <TrendingUp className="w-4 h-4 text-neutral-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
              {referralData?.totalCreditsEarned || 0}
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-500 mt-1">
              All-time credits earned
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Referrals Table */}
      {referralData && referralData.referrals.length > 0 && (
        <Card className="border-neutral-200 dark:border-neutral-800">
          <CardHeader>
            <CardTitle className="text-neutral-900 dark:text-neutral-100">
              Your Referrals
            </CardTitle>
            <CardDescription className="text-neutral-600 dark:text-neutral-400">
              People who signed up using your referral code
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-neutral-200 dark:border-neutral-800">
                    <th className="text-left py-3 px-4 text-sm font-medium text-neutral-600 dark:text-neutral-400">
                      Name
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-neutral-600 dark:text-neutral-400">
                      Email
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-neutral-600 dark:text-neutral-400">
                      Joined
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {referralData.referrals.map((referral) => (
                    <tr
                      key={referral.id}
                      className="border-b border-neutral-100 dark:border-neutral-900 last:border-0"
                    >
                      <td className="py-3 px-4 text-sm text-neutral-900 dark:text-neutral-100">
                        {referral.name || "—"}
                      </td>
                      <td className="py-3 px-4 text-sm text-neutral-600 dark:text-neutral-400">
                        {referral.email || "—"}
                      </td>
                      <td className="py-3 px-4 text-sm text-neutral-600 dark:text-neutral-400">
                        {new Date(referral.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* How it Works */}
      <Card className="border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50">
        <CardHeader>
          <CardTitle className="text-neutral-900 dark:text-neutral-100">
            How it Works
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center text-xs font-medium text-neutral-700 dark:text-neutral-300">
              1
            </div>
            <div>
              <p className="text-sm text-neutral-900 dark:text-neutral-100 font-medium">
                Share your referral link
              </p>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Send your unique link to friends and colleagues
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center text-xs font-medium text-neutral-700 dark:text-neutral-300">
              2
            </div>
            <div>
              <p className="text-sm text-neutral-900 dark:text-neutral-100 font-medium">
                They sign up
              </p>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                When someone creates an account using your link
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center text-xs font-medium text-neutral-700 dark:text-neutral-300">
              3
            </div>
            <div>
              <p className="text-sm text-neutral-900 dark:text-neutral-100 font-medium">
                Earn monthly credits
              </p>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Get 1 free credit per month for each active referral
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
