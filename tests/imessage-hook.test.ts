import assert from "node:assert/strict";
import test from "node:test";
import {
  INCOMING_ONE_AT,
  INCOMING_TWO_AT,
  OUTGOING_TEXT,
  SEND_AT,
  TYPE_START,
  outgoingTypedAt,
  showIncomingOne,
  showIncomingTwo,
  showOutgoingBubble,
} from "../src/templates/imessage-hook/template";

test("imessage hook conversation beats", () => {
  assert.equal(showIncomingOne(INCOMING_ONE_AT - 1), false);
  assert.equal(showIncomingOne(INCOMING_ONE_AT), true);

  assert.equal(outgoingTypedAt(TYPE_START), "");
  assert.equal(outgoingTypedAt(SEND_AT - 1).length, OUTGOING_TEXT.length);
  assert.equal(outgoingTypedAt(SEND_AT), OUTGOING_TEXT);

  assert.equal(showOutgoingBubble(SEND_AT - 1), false);
  assert.equal(showOutgoingBubble(SEND_AT), true);

  assert.equal(showIncomingTwo(INCOMING_TWO_AT - 1), false);
  assert.equal(showIncomingTwo(INCOMING_TWO_AT), true);
});
