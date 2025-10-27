// lib/flow/config.ts
import * as fcl from "@onflow/fcl";

// Configure Flow for Testnet
fcl.config({
  "app.detail.title": "FlowSync",
  "app.detail.icon": "https://flowsync.app/logo.png",
  "accessNode.api": "https://rest-testnet.onflow.org",
  "discovery.wallet": "https://fcl-discovery.onflow.org/testnet/authn",
  "0xFungibleToken": "0x9a0766d93b6608b7",
  "0xFlowToken": "0x7e60df042a9c0868",
  "0xNonFungibleToken": "0x631e88ae7f1d7c20",
  "0xMetadataViews": "0x631e88ae7f1d7c20",
  "flow.network": "testnet",
});

export { fcl };

// Helper functions
export const getCurrentUser = () => fcl.currentUser;
export const authenticate = () => fcl.authenticate();
export const unauthenticate = () => fcl.unauthenticate();
