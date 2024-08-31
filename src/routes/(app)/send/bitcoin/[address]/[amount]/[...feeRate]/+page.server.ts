import { fail, redirect } from "@sveltejs/kit";
import { auth, post, fd } from "$lib/utils";

export async function load({ params: { address, amount, feeRate }, cookies }) {
  try {
    let { fee, fees, ourfee, hex } = await post(
      "/bitcoin/fee",
      { address, amount, feeRate },
      auth(cookies)
    );

    return { amount, address, fee, fees, feeRate, ourfee, hex };
  } catch (e: any) {
    return { amount, address, feeRate, message: e.message };
  }
}

export const actions = {
  default: async ({
    cookies,
    params: { address, amount, feeRate },
    request,
  }) => {
    try {
      await post("/bitcoin/send", await fd(request), auth(cookies));
    } catch (e: any) {
      console.log("problem sending bitcoin", e);
      return fail(400, { address, amount, feeRate, message: e.message });
    }

    redirect(307, "/sent");
  },
};
