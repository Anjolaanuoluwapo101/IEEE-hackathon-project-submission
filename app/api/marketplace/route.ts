import { NextResponse } from "next/server";
import { findDemoAccount } from "@/lib/demo-users";
import { readListings } from "@/lib/data";
import { failure } from "@/lib/api-utils";
import { authorizeApi } from "@/lib/api-auth";
import { MARKETPLACE } from "@/lib/chain";

export async function GET(req: Request) {
  try {
    const auth = await authorizeApi();
    if (auth.response) return auth.response;

    const { searchParams } = new URL(req.url);
    const tokenIdParam = searchParams.get("tokenId");
    const listings = await readListings();

    if (tokenIdParam) {
      const tokenId = Number(tokenIdParam);
      const storeListing = listings.find((listing) => listing.tokenId === tokenId);

      let chainListing: {
        amount: number;
        price: number;
        seller: string;
        active: boolean;
      } | null = null;

      if (!storeListing?.demo) {
        try {
          const listing = await MARKETPLACE.getListing(tokenId);
          chainListing = {
            amount: Number(listing.amount),
            price: Number(listing.price),
            seller: listing.seller,
            active: listing.active,
          };
        } catch {
          chainListing = null;
        }
      }

      return NextResponse.json({
        success: true,
        tokenId,
        listing: { ...storeListing, ...chainListing },
      });
    }

    const view = listings.map((listing) => {
      const seller = findDemoAccount(listing.sellerId);
      return {
        ...listing,
        sellerName: seller?.org ?? listing.sellerId,
        sellerAccount: seller?.name ?? listing.sellerId,
        status: listing.active ? "active" : "sold",
      };
    });

    return NextResponse.json({ success: true, listings: view });
  } catch (err) {
    return failure(err, "Failed to read marketplace");
  }
}
