"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { IMAGE_LIMITS } from "@/lib/config";
import { compressImages } from "@/lib/image-compress";
import { MATERIAL_LABELS, normalizeMaterial } from "@/lib/materials";
import { type Intake } from "@/lib/data";
import { AnchorButton, Button } from "@/components/ui/Button";
import { Card, DarkPanel } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Input } from "@/components/ui/Input";
import { ErrorState } from "@/components/ui/States";

type Selected = { file: File; preview: string };
type Backend = "blob" | "local" | "sample";

const STAGE_LABELS = {
  idle: "",
  compressing: "Compressing photos",
  uploading: "Uploading photos",
  saving: "Getting guidance",
} as const;

const SAMPLE_MATERIALS = [
  "pet",
  "hdpe",
  "plastic",
  "paper",
  "glass",
  "metal",
  "organic",
  "e_waste",
] as const;

export default function ScanClient({
  picker,
}: {
  picker: { id: string; name: string; area: string; org: string };
}) {
  const [location, setLocation] = useState(picker.area);
  const [description, setDescription] = useState("");
  const [selected, setSelected] = useState<Selected[]>([]);
  const [stage, setStage] = useState<keyof typeof STAGE_LABELS>("idle");
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [result, setResult] = useState<Intake | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [duplicateOf, setDuplicateOf] = useState<string | null>(null);
  const [backend, setBackend] = useState<Backend | null>(null);
  const [sampleMaterial, setSampleMaterial] = useState<string>("");

  const previewsRef = useRef<string[]>([]);

  useEffect(() => {
    let active = true;
    fetch("/api/upload")
      .then((res) => res.json())
      .then((data) => {
        if (active && data?.backend) setBackend(data.backend as Backend);
      })
      .catch(() => undefined);

    return () => {
      active = false;
      previewsRef.current.forEach((url) => URL.revokeObjectURL(url));
      previewsRef.current = [];
    };
  }, []);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const canUpload = backend === "blob" || backend === "local";

  const addFiles = (incoming: File[]) => {
    setError(null);
    const remaining = IMAGE_LIMITS.maxFiles - selected.length;
    if (remaining <= 0) {
      setError(`You can attach up to ${IMAGE_LIMITS.maxFiles} photos.`);
      return;
    }
    const next = incoming.slice(0, remaining).map((file) => {
      const preview = URL.createObjectURL(file);
      previewsRef.current.push(preview);
      return { file, preview };
    });
    setSelected((current) => [...current, ...next]);
  };

  const removeFile = (index: number) => {
    setSelected((current) => {
      const target = current[index];
      if (target) {
        URL.revokeObjectURL(target.preview);
        previewsRef.current = previewsRef.current.filter(
          (url) => url !== target.preview
        );
      }
      return current.filter((_, i) => i !== index);
    });
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setDuplicateOf(null);
    setResult(null);
    setIsSubmitting(true);

    if (!location.trim()) {
      setError("Enter a location.");
      return;
    }
    if (selected.length === 0 && !sampleMaterial) {
      setError("Add at least one photo, or use a sample photo.");
      return;
    }
    if (selected.length > 0 && !canUpload) {
      setError(
        "Image storage is not configured on this deployment. Use a sample photo instead."
      );
      return;
    }

    try {
      let imageUrls: string[] = [];
      let imageHashes: string[] = [];
      let imageSources: string[] = [];

      if (selected.length > 0) {
        setStage("compressing");
        setProgress({ done: 0, total: selected.length });
        const compressed = await compressImages(
          selected.map((item) => item.file),
          (done, total) => setProgress({ done, total })
        );

        setStage("uploading");
        const form = new FormData();
        form.append("prefix", "intake");
        compressed.forEach((file) => form.append("files", file));

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: form,
        });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) {
          throw new Error(uploadData?.error ?? "Upload failed");
        }

        imageUrls = (uploadData.images as Array<{ url: string }>).map(
          (image) => image.url
        );
        imageHashes = (uploadData.images as Array<{ hash: string }>).map(
          (image) => image.hash
        );
        imageSources = (uploadData.images as Array<{ backend: string }>).map(
          (image) => image.backend
        );
      }

      setStage("saving");
      const intakeRes = await fetch("/api/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location,
          description,
          imageUrls,
          imageHashes,
          imageSources,
          sampleMaterial: selected.length === 0 ? sampleMaterial : undefined,
        }),
      });
      const intakeData = await intakeRes.json();

      if (intakeRes.status === 409) {
        setDuplicateOf(intakeData?.duplicateOf ?? null);
        throw new Error(
          intakeData?.error ?? "This photo has already been scanned."
        );
      }
      if (!intakeRes.ok) {
        throw new Error(intakeData?.error ?? "Could not save the scan");
      }

      setResult(intakeData.intake as Intake);
      selected.forEach((item) => URL.revokeObjectURL(item.preview));
      previewsRef.current = [];
      setSelected([]);
      setSampleMaterial("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setStage("idle");
      setProgress({ done: 0, total: 0 });
      setIsSubmitting(false);
    }
  };

  const ai = result?.aiResult;
  const material = ai ? normalizeMaterial(ai.material) : null;

  const handleSampleSelect = (mat: string) => {
    setSampleMaterial(mat);
  };

  const isLoading = stage !== "idle";

  return (
    <div className="f" style={{ display: "flex", minHeight: "820px", background: "var(--color-bg-primary)" }}>
      <aside data-cl-sidebar data-role="picker" data-active="0" />
      <main style={{ flex: 1, minWidth: 0, padding: "36px 48px" }}>
        <div className="row" style={{ justifyContent: "space-between", alignItems: "flexEnd" }}>
          <div>
            <div className="eye" style={{ color: "var(--color-emerald)" }}>Picker</div>
            <h1 className="d" style={{ fontSize: "48px", margin: "6px 0 6px" }}>Scan your waste</h1>
            <p style={{ margin: 0, fontSize: "16px", color: "var(--color-muted)" }}>Take a clear photo and we&apos;ll tell you what it is.</p>
          </div>
        </div>

        <div style={{ marginTop: "28px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", alignItems: "start" }}>
            <DarkPanel padding="lg" style={{ minHeight: "420px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "16px", textAlign: "center" }}>
              {selected.length > 0 && selected[0].preview ? (
                <Image
                  src={selected[0].preview}
                  alt="Selected photo"
                  width={320}
                  height={320}
                  className="rounded-2xl"
                  unoptimized
                />
              ) : (
<>
  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#9FE9C3" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
  </svg>
  <div className="d" style={{ fontSize: "28px" }}>Take a photo of your waste</div>
  <div style={{ color: "#BFF3D8", fontWeight: 600 }}>Good light, one material at a time.</div>
  <Button variant="brand" onClick={() => document.getElementById("file-input")?.click()} disabled={isSubmitting || !canUpload}>Take photo</Button>
</>
              )}
            </DarkPanel>

            <Card padding="lg">
              <div className="eye">Location</div>
              <div style={{ marginTop: "10px" }}>
                <Badge variant="available"><i />{location} · auto</Badge>
              </div>
              <Input
                label="Short description (optional)"
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. clear bottles, rinsed"
              />
<div className="row" style={{ marginTop: "20px", gap: "12px" }}>
  <Button variant="secondary" onClick={() => document.getElementById("file-input")?.click()} disabled={isSubmitting || !canUpload}>Upload instead</Button>
  <Button variant="brand" onClick={() => document.getElementById("file-input")?.click()} disabled={isSubmitting || !canUpload}>Analyze<span className="lime"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7" /></svg></span></Button>
</div>
              <input id="file-input" type="file" accept="image/jpeg,image/png,image/webp" capture="environment" multiple hidden onChange={(e) => { addFiles(Array.from(e.target.files ?? [])); }} disabled={isSubmitting || !canUpload} />
            </Card>
          </div>

          {error && (
            <ErrorState
              title="Error"
              message={error}
              onRetry={() => setError(null)}
              retryLabel="Dismiss"
            />
          )}

          {isLoading && (
            <div className="card p-8 text-center animate-fade-in">
              <div className="spin" style={{ width: "48px", height: "48px", borderWidth: "4px", borderColor: "var(--color-emerald) transparent transparent transparent", margin: "0 auto 16px", borderRadius: "50%", borderStyle: "solid" }} />
              <div className="b8" style={{ fontSize: "24px" }}>{STAGE_LABELS[stage]}</div>
              <ProgressBar value={progress.done} max={progress.total} style={{ marginTop: "16px", maxWidth: "300px", marginLeft: "auto", marginRight: "auto" }} showLabel />
            </div>
          )}

          {result && !isLoading && (
            <div className="mt-4 text-center">
              <AnchorButton variant="brand" size="lg" href={`/scan/result/${result.id}`}>
                Continue to result
              </AnchorButton>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}