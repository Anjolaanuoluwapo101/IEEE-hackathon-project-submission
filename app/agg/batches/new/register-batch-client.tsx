"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { DEMO_PICKERS } from "@/lib/demo-users";
import {
  CANONICAL_MATERIALS,
  MATERIAL_LABELS,
  normalizeMaterial,
} from "@/lib/materials";
import type { Intake } from "@/lib/data";

type Registered = { id: string; material: string; loggedWeightKg: number };

export default function RegisterBatchClient() {
  const searchParams = useSearchParams();
  const queryPicker = searchParams.get("pickerId");
  const queryIntake = searchParams.get("intakeId");

  const initialPicker =
    queryPicker && DEMO_PICKERS.some((picker) => picker.id === queryPicker)
      ? queryPicker
      : DEMO_PICKERS[0].id;

  const [pickerId, setPickerId] = useState(initialPicker);
  const [intakes, setIntakes] = useState<Intake[]>([]);
  const [intakeId, setIntakeId] = useState("");
  const [material, setMaterial] = useState("");
  const [weight, setWeight] = useState("");
  const [location, setLocation] = useState(
    DEMO_PICKERS.find((picker) => picker.id === initialPicker)?.area ?? ""
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conflictBatchId, setConflictBatchId] = useState<string | null>(null);
  const [registered, setRegistered] = useState<Registered | null>(null);

  useEffect(() => {
    let active = true;
    fetch(`/api/intake?pickerId=${encodeURIComponent(pickerId)}`)
      .then((res) => res.json())
      .then((data) => {
        if (!active) return;
        const list = (data?.intakes ?? []) as Intake[];
        setIntakes(list);

        if (queryIntake) {
          const match = list.find((item) => item.id === queryIntake);
          if (match) {
            setIntakeId(match.id);
            const canonical = normalizeMaterial(match.aiResult?.material);
            if (canonical) setMaterial(canonical);
            if (match.location) setLocation(match.location);
          }
        }
      })
      .catch(() => undefined);

    return () => {
      active = false;
    };
  }, [pickerId, queryIntake]);

  const selectIntake = (id: string) => {
    setIntakeId(id);
    const intake = intakes.find((item) => item.id === id);
    if (!intake) return;
    const canonical = normalizeMaterial(intake.aiResult?.material);
    if (canonical) setMaterial(canonical);
    if (intake.location) setLocation(intake.location);
  };

  const handlePickerChange = (id: string) => {
    setPickerId(id);
    setIntakeId("");
    setIntakes([]);
    const picker = DEMO_PICKERS.find((user) => user.id === id);
    if (picker) setLocation(picker.area);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setConflictBatchId(null);
    setRegistered(null);

    if (!intakeId) {
      setError("Select the picker's scan as evidence for this batch.");
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch("/api/batches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pickerId,
          intakeId: intakeId || undefined,
          material,
          loggedWeightKg: Number.parseFloat(weight),
          location,
        }),
      });
      const data = await res.json();

      if (res.status === 409) {
        setConflictBatchId(data?.existingBatchId ?? null);
        throw new Error(data?.error ?? "This photo is already registered.");
      }
      if (!res.ok) {
        throw new Error(data?.error ?? "Could not register the batch");
      }

      setRegistered({
        id: data.batch.id,
        material: data.batch.material,
        loggedWeightKg: data.batch.loggedWeightKg,
      });
      setWeight("");
      setIntakeId("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const selectedIntake = intakes.find((item) => item.id === intakeId) ?? null;

  return (
    <div className="min-h-full bg-gray-50 p-4 sm:p-8">
      <div className="max-w-lg mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Register Batch</h1>
          <p className="text-gray-600 mt-2">
            Link the picker&apos;s scan, weigh the batch, and register it.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-6 bg-white p-6 rounded-xl shadow-sm border border-gray-200"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Picker
            </label>
            <select
              value={pickerId}
              onChange={(event) => handlePickerChange(event.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              {DEMO_PICKERS.map((picker) => (
                <option key={picker.id} value={picker.id}>
                  {picker.name} · {picker.area}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Linked scan (evidence)
            </label>
            <select
              value={intakeId}
              onChange={(event) => selectIntake(event.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="">No linked scan</option>
              {intakes.map((intake) => (
                <option key={intake.id} value={intake.id}>
                  {intake.aiResult
                    ? `${MATERIAL_LABELS[normalizeMaterial(intake.aiResult.material) ?? "general_mixed_recyclables"]} · ${intake.location}`
                    : `${intake.location} · unclassified`}{" "}
                  ({new Date(intake.createdAt).toLocaleDateString()})
                </option>
              ))}
            </select>

            {intakes.length === 0 && (
              <p className="mt-1 text-xs text-gray-500">
                No unregistered scans for this picker yet. Ask the picker to scan
                the waste first.
              </p>
            )}

            {selectedIntake && (
              <div className="mt-3 flex items-center gap-3 rounded-lg border border-gray-200 p-3">
                {selectedIntake.imageUrls[0] && (
                  <Image
                    src={selectedIntake.imageUrls[0]}
                    alt="Scan evidence"
                    width={64}
                    height={64}
                    unoptimized
                    className="h-16 w-16 rounded-lg object-cover"
                  />
                )}
                <div className="text-sm">
                  <p className="font-medium text-gray-900">
                    {selectedIntake.aiResult?.confidence
                      ? `${Math.round(selectedIntake.aiResult.confidence * 100)}% confidence`
                      : "Unclassified"}
                  </p>
                  <p className="text-gray-600">
                    {selectedIntake.description || "No description"}
                  </p>
                  <p className="font-mono text-xs text-gray-400">
                    {selectedIntake.id}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Material
            </label>
            <select
              value={material}
              onChange={(event) => setMaterial(event.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="">Select material</option>
              {CANONICAL_MATERIALS.map((item) => (
                <option key={item} value={item}>
                  {MATERIAL_LABELS[item]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Weight (kg)
            </label>
            <input
              type="number"
              min="0.1"
              step="0.1"
              value={weight}
              onChange={(event) => setWeight(event.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Location
            </label>
            <input
              type="text"
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="e.g., Ikeja, Lagos"
            />
          </div>

          <button
            type="submit"
            disabled={
              submitting ||
              !pickerId ||
              !intakeId ||
              !material ||
              !weight ||
              !location.trim()
            }
            className="w-full py-3 px-4 bg-green-600 text-white rounded-lg font-semibold disabled:opacity-50 hover:bg-green-700 transition-colors"
          >
            {submitting ? "Registering..." : "Register Batch"}
          </button>
        </form>

        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <p>{error}</p>
            {conflictBatchId && (
              <p className="mt-1">
                Existing batch:{" "}
                <span className="font-mono">{conflictBatchId}</span>
              </p>
            )}
          </div>
        )}

        {registered && (
          <div className="mt-4 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-900">
            <p className="font-semibold">Batch registered</p>
            <p className="mt-1 font-mono text-xs">{registered.id}</p>
            <p className="mt-1">
              {MATERIAL_LABELS[normalizeMaterial(registered.material) ?? "general_mixed_recyclables"]}{" "}
              · {registered.loggedWeightKg} kg
            </p>
            <div className="mt-3 flex flex-wrap gap-3">
              <Link
                href={`/agg/batches/${registered.id}`}
                className="inline-block text-green-800 underline"
              >
                Assign a recycler
              </Link>
              <button
                onClick={() => setRegistered(null)}
                className="inline-block text-green-800 underline"
              >
                Register another
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
