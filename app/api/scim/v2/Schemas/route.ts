import { scimResponse, SCIM_SCHEMAS, listResponse, validateScimToken } from "@/lib/scim";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const USER_SCHEMA = {
  id: SCIM_SCHEMAS.user,
  name: "User",
  description: "User Account",
  attributes: [
    {
      name: "userName",
      type: "string",
      multiValued: false,
      required: true,
      caseExact: false,
      mutability: "readWrite",
      returned: "default",
      uniqueness: "server",
    },
    {
      name: "name",
      type: "complex",
      multiValued: false,
      required: false,
      subAttributes: [
        {
          name: "formatted",
          type: "string",
          multiValued: false,
          required: false,
          caseExact: false,
          mutability: "readWrite",
          returned: "default",
          uniqueness: "none",
        },
        {
          name: "givenName",
          type: "string",
          multiValued: false,
          required: false,
          caseExact: false,
          mutability: "readWrite",
          returned: "default",
          uniqueness: "none",
        },
        {
          name: "familyName",
          type: "string",
          multiValued: false,
          required: false,
          caseExact: false,
          mutability: "readWrite",
          returned: "default",
          uniqueness: "none",
        },
      ],
      mutability: "readWrite",
      returned: "default",
      uniqueness: "none",
    },
    {
      name: "displayName",
      type: "string",
      multiValued: false,
      required: false,
      caseExact: false,
      mutability: "readWrite",
      returned: "default",
      uniqueness: "none",
    },
    {
      name: "emails",
      type: "complex",
      multiValued: true,
      required: false,
      subAttributes: [
        {
          name: "value",
          type: "string",
          multiValued: false,
          required: false,
          caseExact: false,
          mutability: "readWrite",
          returned: "default",
          uniqueness: "none",
        },
        {
          name: "type",
          type: "string",
          multiValued: false,
          required: false,
          caseExact: false,
          mutability: "readWrite",
          returned: "default",
          uniqueness: "none",
        },
        {
          name: "primary",
          type: "boolean",
          multiValued: false,
          required: false,
          mutability: "readWrite",
          returned: "default",
          uniqueness: "none",
        },
      ],
      mutability: "readWrite",
      returned: "default",
      uniqueness: "none",
    },
    {
      name: "active",
      type: "boolean",
      multiValued: false,
      required: false,
      mutability: "readWrite",
      returned: "default",
      uniqueness: "none",
    },
  ],
  meta: {
    resourceType: "Schema",
    location: "/api/scim/v2/Schemas/urn:ietf:params:scim:schemas:core:2.0:User",
  },
};

const ENTERPRISE_USER_SCHEMA = {
  id: SCIM_SCHEMAS.enterpriseUser,
  name: "EnterpriseUser",
  description: "Enterprise User Extension",
  attributes: [
    {
      name: "organization",
      type: "string",
      multiValued: false,
      required: false,
      caseExact: false,
      mutability: "readWrite",
      returned: "default",
      uniqueness: "none",
    },
    {
      name: "department",
      type: "string",
      multiValued: false,
      required: false,
      caseExact: false,
      mutability: "readWrite",
      returned: "default",
      uniqueness: "none",
    },
  ],
  meta: { resourceType: "Schema", location: `/api/scim/v2/Schemas/${SCIM_SCHEMAS.enterpriseUser}` },
};

const GROUP_SCHEMA = {
  id: SCIM_SCHEMAS.group,
  name: "Group",
  description: "Group",
  attributes: [
    {
      name: "displayName",
      type: "string",
      multiValued: false,
      required: true,
      caseExact: false,
      mutability: "readWrite",
      returned: "default",
      uniqueness: "none",
    },
    {
      name: "members",
      type: "complex",
      multiValued: true,
      required: false,
      subAttributes: [
        {
          name: "value",
          type: "string",
          multiValued: false,
          required: false,
          caseExact: false,
          mutability: "readWrite",
          returned: "default",
          uniqueness: "none",
        },
        {
          name: "$ref",
          type: "reference",
          referenceTypes: ["User"],
          multiValued: false,
          required: false,
          mutability: "readWrite",
          returned: "default",
          uniqueness: "none",
        },
      ],
      mutability: "readWrite",
      returned: "default",
      uniqueness: "none",
    },
  ],
  meta: {
    resourceType: "Schema",
    location: "/api/scim/v2/Schemas/urn:ietf:params:scim:schemas:core:2.0:Group",
  },
};

export function GET(request: Request) {
  const token = process.env.SCIM_TOKEN;
  if (token && !validateScimToken(request.headers.get("authorization"), token)) {
    return scimResponse(
      { schemas: [SCIM_SCHEMAS.error], status: 401, detail: "Unauthorized" },
      401,
    );
  }

  const schemas = [USER_SCHEMA, ENTERPRISE_USER_SCHEMA, GROUP_SCHEMA];
  return scimResponse(listResponse(schemas, schemas.length));
}
