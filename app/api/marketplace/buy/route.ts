import { NextResponse } from "next/server";
import { mutateJsonFile } from "@/lib/store";
import { LISTINGS_FILE, readListings, type Listing } from "@/lib/data";
import { failure } from "@/lib/api-utils";
import { authorizeApi } from "@/lib/api-auth";
import { demoTx } from "@/lib/demo";
import { MARKETPLACE, requireSigner, chainTxHash } from "@/lib/chain";

export async function POST(req: Request) {
  try {
    const auth = await authorizeApi("producer");
    if (auth.response) return auth.response;
    const session = auth.session;

    const body = await req.json();
    const { tokenId, amount } = body ?? {};

    const tokenIdNum = Number(tokenId);
    const amountNum = Number(amount);

    if (!Number.isFinite(tokenIdNum) || tokenIdNum <= 0) {
      return NextResponse.json(
        { error: "tokenId must be a positive number" },
        { status: 400 }
      );
    }
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      return NextResponse.json(
        { error: "amount must be a positive number" },
        { status: 400 }
      );
    }

    const listings = await readListings();
    const listing = listings.find(
      (item) => item.tokenId === tokenIdNum && item.active
    );

    if (!listing) {
      return NextResponse.json(
        { error: "No active listing for this token" },
        { status: 404 }
      );
    }

    if (listing.sellerId === session.id) {
      return NextResponse.json(
        { error: "You cannot buy your own listing" },
        { status: 409 }
      );
    }

    if (amountNum > listing.amount) {
      return NextResponse.json(
        { error: "Requested amount exceeds the listed amount" },
        { status: 409 }
      );
    }

    let updated: Listing;

    if (listing.demo) {
      const remaining = Math.max(0, listing.amount - amountNum);
      updated = {
        ...listing,
        amount: remaining,
        active: remaining > 0,
        buyerId: session.id,
        soldAt: new Date().toISOString(),
        txHash: demoTx("buy", String(tokenIdNum)),
      };
    } else {
      requireSigner();
      const value = BigInt(listing.price) * BigInt(amountNum);
      const txHash = await chainTxHash(
        MARKETPLACE.buy(tokenIdNum, amountNum, { value })
      );

      try {
        const onChain = await MARKETPLACE.getListing(tokenIdNum);
        updated = {
          ...listing,
          amount: Number(onChain.amount),
          active: onChain.active,
          buyerId: session.id,
          soldAt: new Date().toISOString(),
          txHash,
        };
      } catch {
        updated = {
          ...listing,
          active: false,
          buyerId: session.id,
          soldAt: new Date().toISOString(),
          txHash,
        };
      }
    }

    await mutateJsonFile<Listing[]>(LISTINGS_FILE, [], (current) =>
      current.map((item) =>
        item.tokenId === tokenIdNum ? updated : item
      )
    );

    return NextResponse.json({ success: true, listing: updated }, { status: 200 });
  } catch (err) {
    return failure(err, "Purchase failed");
  }
}
