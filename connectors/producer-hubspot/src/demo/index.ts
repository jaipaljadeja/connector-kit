import { ConnectorApp, Demo, RuntimeConfig } from "@useairfoil/connector-kit";
import { Command } from "effect/cli";

import {
  CallSchema,
  CartSchema,
  CommercePaymentSchema,
  CommunicationSchema,
  CompanySchema,
  ContactSchema,
  CustomObjectSchema,
  DealSchema,
  DealSplitSchema,
  DiscountSchema,
  EmailSchema,
  FeeSchema,
  FeedbackSubmissionSchema,
  GoalTargetSchema,
  InvoiceSchema,
  LeadSchema,
  LineItemSchema,
  MeetingSchema,
  NoteSchema,
  OrderSchema,
  PostalMailSchema,
  ProductSchema,
  QuoteSchema,
  SubscriptionSchema,
  TaskSchema,
  TaxSchema,
  TicketSchema,
  UserSchema,
} from "../schemas/crm";
import { ListSchema } from "../schemas/lists";
import { OwnerSchema } from "../schemas/owners";
import { PipelineSchema } from "../schemas/pipelines";
import { PropertySchema } from "../schemas/properties";
import { TeamSchema } from "../schemas/teams";
import { companyRows } from "./companies";
import { setupRows } from "./setup";

export const demo = Demo.define({
  name: "producer-hubspot",
  setup: {
    tables: [
      Demo.table({ name: "owners", rowSchema: OwnerSchema, version: "version" }),
      Demo.table({ name: "users", rowSchema: UserSchema, version: "version" }),
      Demo.table({ name: "teams", rowSchema: TeamSchema, version: "version" }),
      Demo.table({ name: "pipelines", rowSchema: PipelineSchema, version: "version" }),
      Demo.table({ name: "properties", rowSchema: PropertySchema, version: "version" }),
      Demo.table({ name: "lists", rowSchema: ListSchema, version: "version" }),
      Demo.table({ name: "products", rowSchema: ProductSchema, version: "version" }),
      Demo.table({ name: "discounts", rowSchema: DiscountSchema, version: "version" }),
      Demo.table({ name: "fees", rowSchema: FeeSchema, version: "version" }),
      Demo.table({ name: "taxes", rowSchema: TaxSchema, version: "version" }),
      Demo.table({ name: "goal_targets", rowSchema: GoalTargetSchema, version: "version" }),
    ],
    rows: setupRows,
  },
  group: {
    tables: [
      Demo.table({ name: "companies", rowSchema: CompanySchema, version: "version" }),
      Demo.table({ name: "contacts", rowSchema: ContactSchema, version: "version" }),
      Demo.table({ name: "deals", rowSchema: DealSchema, version: "version" }),
      Demo.table({ name: "line_items", rowSchema: LineItemSchema, version: "version" }),
      Demo.table({ name: "quotes", rowSchema: QuoteSchema, version: "version" }),
      Demo.table({ name: "deal_split", rowSchema: DealSplitSchema, version: "version" }),
      Demo.table({ name: "tickets", rowSchema: TicketSchema, version: "version" }),
      Demo.table({ name: "calls", rowSchema: CallSchema, version: "version" }),
      Demo.table({ name: "emails", rowSchema: EmailSchema, version: "version" }),
      Demo.table({ name: "meetings", rowSchema: MeetingSchema, version: "version" }),
      Demo.table({ name: "notes", rowSchema: NoteSchema, version: "version" }),
      Demo.table({ name: "tasks", rowSchema: TaskSchema, version: "version" }),
      Demo.table({ name: "communications", rowSchema: CommunicationSchema, version: "version" }),
      Demo.table({ name: "postal_mail", rowSchema: PostalMailSchema, version: "version" }),
      Demo.table({
        name: "feedback_submissions",
        rowSchema: FeedbackSubmissionSchema,
        version: "version",
      }),
      Demo.table({ name: "leads", rowSchema: LeadSchema, version: "version" }),
      Demo.table({ name: "invoices", rowSchema: InvoiceSchema, version: "version" }),
      Demo.table({ name: "orders", rowSchema: OrderSchema, version: "version" }),
      Demo.table({ name: "carts", rowSchema: CartSchema, version: "version" }),
      Demo.table({
        name: "commerce_payments",
        rowSchema: CommercePaymentSchema,
        version: "version",
      }),
      Demo.table({ name: "subscriptions", rowSchema: SubscriptionSchema, version: "version" }),
      Demo.table({ name: "custom_objects", rowSchema: CustomObjectSchema, version: "version" }),
    ],
    rows: companyRows,
  },
});

export const demoCommand = ConnectorApp.makeDemoCommand(demo).pipe(
  Command.provide(RuntimeConfig.layerHosted()),
);
