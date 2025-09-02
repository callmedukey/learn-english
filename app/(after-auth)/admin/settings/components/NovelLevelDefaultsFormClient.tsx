"use client";

import React, { useActionState, useState } from "react";

import { updateARLevelDefaults } from "../actions/settings-actions";

interface ARLevelWithSettings {
  id: string;
  level: string;
  score: string;
  relevantGrade: string | null;
  ARSettings: {
    id: string;
    defaultTimer: number;
    defaultScore: number;
  } | null;
}

interface NovelLevelDefaultsFormClientProps {
  arLevels: ARLevelWithSettings[];
}

export default function NovelLevelDefaultsFormClient({
  arLevels,
}: NovelLevelDefaultsFormClientProps) {
  const [editingLevelId, setEditingLevelId] = useState<string | null>(null);
  const [state, formAction, isPending] = useActionState(updateARLevelDefaults, null);
  const [levelDefaults, setLevelDefaults] = useState<{[key: string]: {timer: number, score: number}}>(() => {
    const defaults: {[key: string]: {timer: number, score: number}} = {};
    arLevels.forEach(level => {
      defaults[level.id] = {
        timer: level.ARSettings?.defaultTimer || 30,
        score: level.ARSettings?.defaultScore || 100,
      };
    });
    return defaults;
  });

  const handleSubmit = async (formData: FormData) => {
    await formAction(formData);
    setEditingLevelId(null);
  };

  const handleEdit = (levelId: string) => {
    setEditingLevelId(levelId);
  };

  const handleCancel = () => {
    // Reset to original values
    const level = arLevels.find(l => l.id === editingLevelId);
    if (level && editingLevelId) {
      setLevelDefaults(prev => ({
        ...prev,
        [editingLevelId]: {
          timer: level.ARSettings?.defaultTimer || 30,
          score: level.ARSettings?.defaultScore || 100,
        }
      }));
    }
    setEditingLevelId(null);
  };

  const handleInputChange = (levelId: string, field: 'timer' | 'score', value: string) => {
    const numValue = parseInt(value) || 0;
    setLevelDefaults(prev => ({
      ...prev,
      [levelId]: {
        ...prev[levelId],
        [field]: numValue,
      }
    }));
  };

  if (!arLevels || arLevels.length === 0) {
    return (
      <p className="text-gray-500">No Novel levels found. Please create Novel levels first.</p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Level</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Lexile Score</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Grade</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Default Timer (seconds)</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Default Score</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {arLevels.map((level) => (
              <tr key={level.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium text-gray-900">{level.level}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{level.score}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{level.relevantGrade || "-"}</td>
                <td className="px-4 py-3">
                  {editingLevelId === level.id ? (
                    <form action={handleSubmit} className="flex items-center gap-2">
                      <input type="hidden" name="levelId" value={level.id} />
                      <input
                        type="number"
                        name="defaultTimer"
                        min="0"
                        value={levelDefaults[level.id]?.timer || 30}
                        onChange={(e) => handleInputChange(level.id, 'timer', e.target.value)}
                        className="w-20 rounded border border-gray-300 px-2 py-1 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                        disabled={isPending}
                      />
                    </form>
                  ) : (
                    <span className="text-sm text-gray-700">
                      {levelDefaults[level.id]?.timer || 30}s
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {editingLevelId === level.id ? (
                    <form action={handleSubmit} className="flex items-center gap-2">
                      <input
                        type="number"
                        name="defaultScore"
                        min="0"
                        value={levelDefaults[level.id]?.score || 100}
                        onChange={(e) => handleInputChange(level.id, 'score', e.target.value)}
                        className="w-20 rounded border border-gray-300 px-2 py-1 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                        disabled={isPending}
                      />
                    </form>
                  ) : (
                    <span className="text-sm text-gray-700">
                      {levelDefaults[level.id]?.score || 100} pts
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {editingLevelId === level.id ? (
                    <div className="flex gap-2">
                      <form action={handleSubmit}>
                        <input type="hidden" name="levelId" value={level.id} />
                        <input type="hidden" name="defaultTimer" value={levelDefaults[level.id]?.timer || 30} />
                        <input type="hidden" name="defaultScore" value={levelDefaults[level.id]?.score || 100} />
                        <button
                          type="submit"
                          disabled={isPending}
                          className="rounded bg-green-500 px-3 py-1 text-xs text-white hover:bg-green-600 focus:ring-2 focus:ring-green-500 focus:ring-offset-1 focus:outline-none disabled:opacity-50"
                        >
                          {isPending ? "Saving..." : "Save"}
                        </button>
                      </form>
                      <button
                        onClick={handleCancel}
                        disabled={isPending}
                        className="rounded bg-gray-500 px-3 py-1 text-xs text-white hover:bg-gray-600 focus:ring-2 focus:ring-gray-500 focus:ring-offset-1 focus:outline-none disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleEdit(level.id)}
                      className="rounded bg-amber-500 px-3 py-1 text-xs text-white hover:bg-amber-600 focus:ring-2 focus:ring-amber-500 focus:ring-offset-1 focus:outline-none"
                    >
                      Edit
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {state && (
        <div
          className={`rounded-md p-3 text-sm ${
            state.success
              ? "border border-green-200 bg-green-50 text-green-800"
              : "border border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {state.success ? "Level defaults updated successfully!" : state.error}
        </div>
      )}
    </div>
  );
}