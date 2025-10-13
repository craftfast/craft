"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

interface Team {
  id: string;
  name: string;
  slug: string;
  isPersonal: boolean;
  role: string;
  subscription: {
    plan: {
      name: string;
      displayName: string;
    };
  } | null;
}

interface TeamSwitcherProps {
  currentTeam: {
    id: string;
    name: string;
    subscription: {
      plan: {
        name: string;
        displayName: string;
      };
    } | null;
  };
}

export default function TeamSwitcher({ currentTeam }: TeamSwitcherProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch teams when dropdown opens
  useEffect(() => {
    if (isOpen && teams.length === 0) {
      fetchTeams();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isOpen]);

  const fetchTeams = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/teams");
      if (!response.ok) {
        throw new Error("Failed to fetch teams");
      }
      const data = await response.json();
      setTeams(data.teams || []);
    } catch (err) {
      console.error("Error fetching teams:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleTeamSwitch = async (teamId: string) => {
    try {
      setIsOpen(false);

      // Call API to switch team (sets cookie)
      const response = await fetch("/api/teams/switch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ teamId }),
      });

      if (!response.ok) {
        throw new Error("Failed to switch team");
      }

      // Refresh the page to load the new team
      router.refresh();
    } catch (err) {
      console.error("Error switching team:", err);
      setIsOpen(false);
    }
  };

  const getPlanBadge = (planName: string) => {
    if (planName === "HOBBY" || planName === "PRO") {
      return (
        <span className="ml-auto px-1.5 py-0.5 text-xs font-medium bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400 rounded-md">
          {planName === "HOBBY" ? "Hobby" : "Pro"}
        </span>
      );
    }
    return null;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-1.5 text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors"
        aria-label="Switch team"
      >
        <svg
          className={`w-4 h-4 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 9l4-4 4 4m0 6l-4 4-4-4"
          />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-2 w-72 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-lg z-50">
          <div className="p-2">
            <div className="px-3 py-2 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
              Switch Team
            </div>

            {loading ? (
              <div className="px-3 py-4 text-sm text-neutral-500 dark:text-neutral-400 text-center">
                Loading teams...
              </div>
            ) : teams.length === 0 ? (
              <div className="px-3 py-4 text-sm text-neutral-500 dark:text-neutral-400 text-center">
                No teams found
              </div>
            ) : (
              <div className="space-y-1">
                {teams.map((team) => (
                  <button
                    key={team.id}
                    onClick={() => handleTeamSwitch(team.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-colors ${
                      team.id === currentTeam.id
                        ? "bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                        : "text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                    }`}
                  >
                    {/* Team Icon */}
                    <div
                      className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                        team.isPersonal
                          ? "bg-neutral-200 dark:bg-neutral-700"
                          : "bg-neutral-300 dark:bg-neutral-600"
                      }`}
                    >
                      <svg
                        className="w-4 h-4 text-neutral-600 dark:text-neutral-300"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        {team.isPersonal ? (
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        ) : (
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                          />
                        )}
                      </svg>
                    </div>

                    {/* Team Info */}
                    <div className="flex-1 text-left min-w-0">
                      <div className="font-medium truncate">{team.name}</div>
                      <div className="text-xs text-neutral-500 dark:text-neutral-400 capitalize">
                        {team.role}
                        {team.isPersonal && " • Personal"}
                      </div>
                    </div>

                    {/* Plan Badge */}
                    {team.subscription?.plan.name &&
                      getPlanBadge(team.subscription.plan.name)}

                    {/* Current Team Indicator */}
                    {team.id === currentTeam.id && (
                      <svg
                        className="flex-shrink-0 w-4 h-4 text-neutral-900 dark:text-neutral-100"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Create Team Button (Future Feature) */}
            <div className="mt-2 pt-2 border-t border-neutral-200 dark:border-neutral-700">
              <button
                onClick={() => {
                  setIsOpen(false);
                  // TODO: Navigate to create team page
                  console.log("Create new team");
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded-lg transition-colors"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                <span>Create new team</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
