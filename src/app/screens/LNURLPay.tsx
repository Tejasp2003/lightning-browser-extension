import React, { useState, MouseEvent } from "react";
import axios from "axios";
import sha256 from "crypto-js/sha256";
import Hex from "crypto-js/enc-hex";
import * as invoiceParser from "@node-lightning/invoice";

import msg from "../../common/lib/msg";

import Button from "../components/button";
import PublisherCard from "../components/PublisherCard";

type Props = {
  details: {
    minSendable: number;
    maxSendable: number;
    callback: string;
  };
  origin: {
    name: string;
    icon: string;
  };
};

function LNURLPay({ details, origin }: Props) {
  const [value, setValue] = useState<string | number>(details.minSendable);

  async function confirm() {
    try {
      // Request the invoice
      const res = await axios.get(details.callback, {
        params: { amount: value },
      });
      const invoice = invoiceParser.decode(res.data.pr);

      // LN WALLET Verifies that h tag (description_hash) in provided invoice is a hash of metadata string converted to byte array in UTF-8 encoding
      const metadataHex = await sha256(details.metadata).toString(Hex);
      const hTagHex = Array.from(invoice.hashDesc)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join(""); // convert bytes to hex string
      if (hTagHex !== metadataHex) {
        alert("Invoice invalid.");
        return;
      }

      // LN WALLET Verifies that amount in provided invoice equals an amount previously specified by user
      if (invoice.valueMsat !== String(value)) {
        alert("Invoice invalid.");
        return;
      }

      // If routes array is not empty: verifies signature for every provided ChannelUpdate, may use these routes if fee levels are acceptable

      // If successAction is not null: LN WALLET makes sure that tag value of is of supported type, aborts a payment otherwise

      // LN WALLET pays the invoice, no additional user confirmation is required at this point

      // Once payment is fulfilled LN WALLET executes a non-null successAction
      // For message, a toaster or popup is sufficient
      // For url, the wallet should give the user a popup which displays description, url, and a 'open' button to open the url in a new browser tab
      // For aes, LN WALLET must attempt to decrypt a ciphertext with payment preimage. LN WALLET should also store successAction data on the transaction record
    } catch (e) {
      console.log(e.message);
    }

    // Check if all is ok and pay the invoice

    // return await msg.reply({
    //   confirmed: true,
    // });
  }

  function reject(e: MouseEvent) {
    e.preventDefault();
    msg.error("User rejected");
  }

  function renderAmount() {
    if (details.minSendable === details.maxSendable) {
      return <p>{details.minSendable} satoshi</p>;
    } else {
      return (
        <div className="flex flex-col">
          <input
            type="range"
            min={details.minSendable}
            max={details.maxSendable}
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
          <output className="mt-1 text-sm">{value} satoshi</output>
        </div>
      );
    }
  }

  return (
    <div>
      <PublisherCard title={origin.name} image={origin.icon} />
      <div className="p-6">
        <dl className="shadow p-4 rounded-lg mb-8">
          <dt className="font-semibold text-gray-500">Send payment to</dt>
          <dd className="mb-6">{origin.name}</dd>
          <dt className="font-semibold text-gray-500">Amount</dt>
          <dd>{renderAmount()}</dd>
        </dl>
        <div className="text-center">
          <div className="mb-5">
            <Button onClick={confirm} label="Confirm" fullWidth />
          </div>

          <p className="mb-3 underline text-sm text-gray-300">
            Only connect with sites you trust.
          </p>

          <a
            className="underline text-sm text-gray-500"
            href="#"
            onClick={reject}
          >
            Cancel
          </a>
        </div>
      </div>
    </div>
  );
}

export default LNURLPay;
