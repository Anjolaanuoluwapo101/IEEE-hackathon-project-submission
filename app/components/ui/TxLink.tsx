"use client";

interface TxLinkProps {
  txHash: string;
  label?: string;
  className?: string;
}

export function TxLink({ txHash, label, className = "" }: TxLinkProps) {
  const shortHash = `${txHash.slice(0, 6)}…${txHash.slice(-4)}`;
  const explorerUrl = `https://www.oklink.com/amoy/tx/${txHash}`;

  return (
    <a
      href={explorerUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`mono text-emerald hover:underline inline-flex items-center gap-1 ${className}`}
      aria-label={`View transaction ${txHash} on explorer`}
    >
      {label && <span>{label}</span>}
      {shortHash}
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
        <polyline points="15 3 21 3 21 9" />
        <line x1="10" y1="14" x2="21" y2="3" />
      </svg>
    </a>
  );
}

interface HashChipProps {
  hash: string;
  label?: string;
  onCopy?: () => void;
  className?: string;
}

export function HashChip({ hash, label, onCopy, className = "" }: HashChipProps) {
  const shortHash = `${hash.slice(0, 8)}…${hash.slice(-6)}`;

  return (
    <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-line text-sm font-mono ${className}`}>
      {label && <span className="text-muted">{label}</span>}
      <span className="text-ink">{shortHash}</span>
      {onCopy && (
        <button
          onClick={onCopy}
          className="p-1 rounded hover:bg-ground transition-colors"
          aria-label="Copy hash"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
        </button>
      )}
    </span>
  );
}