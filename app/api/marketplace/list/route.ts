import { NextResponse } from "next/server";
import { mutateJsonFile } from "@/lib/store";
import {
  LISTINGS_FILE,
  readBatches,
  readListings,
  type Listing,
} from "@/lib/data";
import { failure } from "@/lib/api-utils";
import { authorizeApi } from "@/lib/api-auth";
import { demoTx } from "@/lib/demo";
import { MARKETPLACE, requireSigner, chainTxHash } from "@/lib/chain";

export async function POST(req: Request) {
  try {
    const auth = await authorizeApi("recycler");
    if (auth.response) return auth.response;
    const session = auth.session;

    const body = await req.json();
    const { tokenId, amount, price } = body ?? {};

    const tokenIdNum = Number(tokenId);
    const amountNum = Number(amount);
    const priceNum = Number(price);

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
    if (!Number.isFinite(priceNum) || priceNum <= 0) {
      return NextResponse.json(
        { error: "price must be a positive number" },
        { status: 400 }
      );
    }

    const batches = await readBatches();
    const creditBatch = batches.find(
      (batch) =>
        batch.creditTokenId === tokenIdNum &&
        batch.recyclerId === session.id &&
        batch.status === "retired"
    );

    if (!creditBatch) {
      return NextResponse.json(
        {
          error:
            "This credit was not minted by your recycler account, so you cannot list it",
        },
        { status: 403 }
      );
    }

    if (creditBatch.demo) {
      const listings = await readListings();
      if (listings.some((listing) => listing.tokenId === tokenIdNum && listing.active)) {
        return NextResponse.json(
          { error: "Token already listed for sale" },
          { status: 409 }
        );
      }
    } else {
      requireSigner();
      try {
        const existing = await MARKETPLACE.getListing(tokenIdNum);
        if (existing.active) {
          return NextResponse.json(
            { error: "Token already listed for sale" },
            { status: 409 }
          );
        }
      } catch {
        // Not listed on chain; proceed.
      }
    }

    const txHash = creditBatch.demo
      ? demoTx("list", String(tokenIdNum))
      : await chainTxHash(
          MARKETPLACE.listForSale(tokenIdNum, amountNum, priceNum)
        );

    const listing: Listing = {
      id: `listing-${tokenIdNum}`,
      tokenId: tokenIdNum,
      amount: amountNum,
      price: priceNum,
      sellerId: session.id,
      buyerId: null,
      active: true,
      txHash,
      demo: creditBatch.demo === true,
      soldAt: null,
      createdAt: new Date().toISOString(),
    };

    await mutateJsonFile<Listing[]>(LISTINGS_FILE, [], (current) => {
      const index = current.findIndex(
        (item) => item.tokenId === tokenIdNum
      );
      if (index >= 0) {
        current[index] = listing;
        return current;
      }
      current.push(listing);
      return current;
    });

    return NextResponse.json({ success: true, listing }, { status: 201 });
  } catch (err) {
    return failure(err, "Listing failed");
  }
}
