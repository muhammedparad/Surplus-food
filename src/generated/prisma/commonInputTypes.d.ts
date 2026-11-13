import type * as runtime from "@prisma/client/runtime/client";
import * as $Enums from "./enums.js";
import type * as Prisma from "./internal/prismaNamespace.js";
export type UuidFilter<$PrismaModel = never> = {
    equals?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    in?: string[] | Prisma.ListStringFieldRefInput<$PrismaModel>;
    notIn?: string[] | Prisma.ListStringFieldRefInput<$PrismaModel>;
    lt?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    lte?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    gt?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    gte?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    mode?: Prisma.QueryMode;
    not?: Prisma.NestedUuidFilter<$PrismaModel> | string;
};
export type StringFilter<$PrismaModel = never> = {
    equals?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    in?: string[] | Prisma.ListStringFieldRefInput<$PrismaModel>;
    notIn?: string[] | Prisma.ListStringFieldRefInput<$PrismaModel>;
    lt?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    lte?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    gt?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    gte?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    contains?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    startsWith?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    endsWith?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    mode?: Prisma.QueryMode;
    not?: Prisma.NestedStringFilter<$PrismaModel> | string;
};
export type StringNullableFilter<$PrismaModel = never> = {
    equals?: string | Prisma.StringFieldRefInput<$PrismaModel> | null;
    in?: string[] | Prisma.ListStringFieldRefInput<$PrismaModel> | null;
    notIn?: string[] | Prisma.ListStringFieldRefInput<$PrismaModel> | null;
    lt?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    lte?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    gt?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    gte?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    contains?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    startsWith?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    endsWith?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    mode?: Prisma.QueryMode;
    not?: Prisma.NestedStringNullableFilter<$PrismaModel> | string | null;
};
export type EnumUserStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.UserStatus | Prisma.EnumUserStatusFieldRefInput<$PrismaModel>;
    in?: $Enums.UserStatus[] | Prisma.ListEnumUserStatusFieldRefInput<$PrismaModel>;
    notIn?: $Enums.UserStatus[] | Prisma.ListEnumUserStatusFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumUserStatusFilter<$PrismaModel> | $Enums.UserStatus;
};
export type DateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | Prisma.DateTimeFieldRefInput<$PrismaModel> | null;
    in?: Date[] | string[] | Prisma.ListDateTimeFieldRefInput<$PrismaModel> | null;
    notIn?: Date[] | string[] | Prisma.ListDateTimeFieldRefInput<$PrismaModel> | null;
    lt?: Date | string | Prisma.DateTimeFieldRefInput<$PrismaModel>;
    lte?: Date | string | Prisma.DateTimeFieldRefInput<$PrismaModel>;
    gt?: Date | string | Prisma.DateTimeFieldRefInput<$PrismaModel>;
    gte?: Date | string | Prisma.DateTimeFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null;
};
export type UuidNullableFilter<$PrismaModel = never> = {
    equals?: string | Prisma.StringFieldRefInput<$PrismaModel> | null;
    in?: string[] | Prisma.ListStringFieldRefInput<$PrismaModel> | null;
    notIn?: string[] | Prisma.ListStringFieldRefInput<$PrismaModel> | null;
    lt?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    lte?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    gt?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    gte?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    mode?: Prisma.QueryMode;
    not?: Prisma.NestedUuidNullableFilter<$PrismaModel> | string | null;
};
export type IntFilter<$PrismaModel = never> = {
    equals?: number | Prisma.IntFieldRefInput<$PrismaModel>;
    in?: number[] | Prisma.ListIntFieldRefInput<$PrismaModel>;
    notIn?: number[] | Prisma.ListIntFieldRefInput<$PrismaModel>;
    lt?: number | Prisma.IntFieldRefInput<$PrismaModel>;
    lte?: number | Prisma.IntFieldRefInput<$PrismaModel>;
    gt?: number | Prisma.IntFieldRefInput<$PrismaModel>;
    gte?: number | Prisma.IntFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedIntFilter<$PrismaModel> | number;
};
export type DateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | Prisma.DateTimeFieldRefInput<$PrismaModel>;
    in?: Date[] | string[] | Prisma.ListDateTimeFieldRefInput<$PrismaModel>;
    notIn?: Date[] | string[] | Prisma.ListDateTimeFieldRefInput<$PrismaModel>;
    lt?: Date | string | Prisma.DateTimeFieldRefInput<$PrismaModel>;
    lte?: Date | string | Prisma.DateTimeFieldRefInput<$PrismaModel>;
    gt?: Date | string | Prisma.DateTimeFieldRefInput<$PrismaModel>;
    gte?: Date | string | Prisma.DateTimeFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedDateTimeFilter<$PrismaModel> | Date | string;
};
export type SortOrderInput = {
    sort: Prisma.SortOrder;
    nulls?: Prisma.NullsOrder;
};
export type UuidWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    in?: string[] | Prisma.ListStringFieldRefInput<$PrismaModel>;
    notIn?: string[] | Prisma.ListStringFieldRefInput<$PrismaModel>;
    lt?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    lte?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    gt?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    gte?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    mode?: Prisma.QueryMode;
    not?: Prisma.NestedUuidWithAggregatesFilter<$PrismaModel> | string;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _min?: Prisma.NestedStringFilter<$PrismaModel>;
    _max?: Prisma.NestedStringFilter<$PrismaModel>;
};
export type StringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    in?: string[] | Prisma.ListStringFieldRefInput<$PrismaModel>;
    notIn?: string[] | Prisma.ListStringFieldRefInput<$PrismaModel>;
    lt?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    lte?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    gt?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    gte?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    contains?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    startsWith?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    endsWith?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    mode?: Prisma.QueryMode;
    not?: Prisma.NestedStringWithAggregatesFilter<$PrismaModel> | string;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _min?: Prisma.NestedStringFilter<$PrismaModel>;
    _max?: Prisma.NestedStringFilter<$PrismaModel>;
};
export type StringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | Prisma.StringFieldRefInput<$PrismaModel> | null;
    in?: string[] | Prisma.ListStringFieldRefInput<$PrismaModel> | null;
    notIn?: string[] | Prisma.ListStringFieldRefInput<$PrismaModel> | null;
    lt?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    lte?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    gt?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    gte?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    contains?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    startsWith?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    endsWith?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    mode?: Prisma.QueryMode;
    not?: Prisma.NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null;
    _count?: Prisma.NestedIntNullableFilter<$PrismaModel>;
    _min?: Prisma.NestedStringNullableFilter<$PrismaModel>;
    _max?: Prisma.NestedStringNullableFilter<$PrismaModel>;
};
export type EnumUserStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.UserStatus | Prisma.EnumUserStatusFieldRefInput<$PrismaModel>;
    in?: $Enums.UserStatus[] | Prisma.ListEnumUserStatusFieldRefInput<$PrismaModel>;
    notIn?: $Enums.UserStatus[] | Prisma.ListEnumUserStatusFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumUserStatusWithAggregatesFilter<$PrismaModel> | $Enums.UserStatus;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _min?: Prisma.NestedEnumUserStatusFilter<$PrismaModel>;
    _max?: Prisma.NestedEnumUserStatusFilter<$PrismaModel>;
};
export type DateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | Prisma.DateTimeFieldRefInput<$PrismaModel> | null;
    in?: Date[] | string[] | Prisma.ListDateTimeFieldRefInput<$PrismaModel> | null;
    notIn?: Date[] | string[] | Prisma.ListDateTimeFieldRefInput<$PrismaModel> | null;
    lt?: Date | string | Prisma.DateTimeFieldRefInput<$PrismaModel>;
    lte?: Date | string | Prisma.DateTimeFieldRefInput<$PrismaModel>;
    gt?: Date | string | Prisma.DateTimeFieldRefInput<$PrismaModel>;
    gte?: Date | string | Prisma.DateTimeFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null;
    _count?: Prisma.NestedIntNullableFilter<$PrismaModel>;
    _min?: Prisma.NestedDateTimeNullableFilter<$PrismaModel>;
    _max?: Prisma.NestedDateTimeNullableFilter<$PrismaModel>;
};
export type UuidNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | Prisma.StringFieldRefInput<$PrismaModel> | null;
    in?: string[] | Prisma.ListStringFieldRefInput<$PrismaModel> | null;
    notIn?: string[] | Prisma.ListStringFieldRefInput<$PrismaModel> | null;
    lt?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    lte?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    gt?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    gte?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    mode?: Prisma.QueryMode;
    not?: Prisma.NestedUuidNullableWithAggregatesFilter<$PrismaModel> | string | null;
    _count?: Prisma.NestedIntNullableFilter<$PrismaModel>;
    _min?: Prisma.NestedStringNullableFilter<$PrismaModel>;
    _max?: Prisma.NestedStringNullableFilter<$PrismaModel>;
};
export type IntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | Prisma.IntFieldRefInput<$PrismaModel>;
    in?: number[] | Prisma.ListIntFieldRefInput<$PrismaModel>;
    notIn?: number[] | Prisma.ListIntFieldRefInput<$PrismaModel>;
    lt?: number | Prisma.IntFieldRefInput<$PrismaModel>;
    lte?: number | Prisma.IntFieldRefInput<$PrismaModel>;
    gt?: number | Prisma.IntFieldRefInput<$PrismaModel>;
    gte?: number | Prisma.IntFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedIntWithAggregatesFilter<$PrismaModel> | number;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _avg?: Prisma.NestedFloatFilter<$PrismaModel>;
    _sum?: Prisma.NestedIntFilter<$PrismaModel>;
    _min?: Prisma.NestedIntFilter<$PrismaModel>;
    _max?: Prisma.NestedIntFilter<$PrismaModel>;
};
export type DateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | Prisma.DateTimeFieldRefInput<$PrismaModel>;
    in?: Date[] | string[] | Prisma.ListDateTimeFieldRefInput<$PrismaModel>;
    notIn?: Date[] | string[] | Prisma.ListDateTimeFieldRefInput<$PrismaModel>;
    lt?: Date | string | Prisma.DateTimeFieldRefInput<$PrismaModel>;
    lte?: Date | string | Prisma.DateTimeFieldRefInput<$PrismaModel>;
    gt?: Date | string | Prisma.DateTimeFieldRefInput<$PrismaModel>;
    gte?: Date | string | Prisma.DateTimeFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _min?: Prisma.NestedDateTimeFilter<$PrismaModel>;
    _max?: Prisma.NestedDateTimeFilter<$PrismaModel>;
};
export type EnumAuthProviderFilter<$PrismaModel = never> = {
    equals?: $Enums.AuthProvider | Prisma.EnumAuthProviderFieldRefInput<$PrismaModel>;
    in?: $Enums.AuthProvider[] | Prisma.ListEnumAuthProviderFieldRefInput<$PrismaModel>;
    notIn?: $Enums.AuthProvider[] | Prisma.ListEnumAuthProviderFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumAuthProviderFilter<$PrismaModel> | $Enums.AuthProvider;
};
export type EnumAuthProviderWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.AuthProvider | Prisma.EnumAuthProviderFieldRefInput<$PrismaModel>;
    in?: $Enums.AuthProvider[] | Prisma.ListEnumAuthProviderFieldRefInput<$PrismaModel>;
    notIn?: $Enums.AuthProvider[] | Prisma.ListEnumAuthProviderFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumAuthProviderWithAggregatesFilter<$PrismaModel> | $Enums.AuthProvider;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _min?: Prisma.NestedEnumAuthProviderFilter<$PrismaModel>;
    _max?: Prisma.NestedEnumAuthProviderFilter<$PrismaModel>;
};
export type EnumRoleScopeFilter<$PrismaModel = never> = {
    equals?: $Enums.RoleScope | Prisma.EnumRoleScopeFieldRefInput<$PrismaModel>;
    in?: $Enums.RoleScope[] | Prisma.ListEnumRoleScopeFieldRefInput<$PrismaModel>;
    notIn?: $Enums.RoleScope[] | Prisma.ListEnumRoleScopeFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumRoleScopeFilter<$PrismaModel> | $Enums.RoleScope;
};
export type BoolFilter<$PrismaModel = never> = {
    equals?: boolean | Prisma.BooleanFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedBoolFilter<$PrismaModel> | boolean;
};
export type EnumRoleScopeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.RoleScope | Prisma.EnumRoleScopeFieldRefInput<$PrismaModel>;
    in?: $Enums.RoleScope[] | Prisma.ListEnumRoleScopeFieldRefInput<$PrismaModel>;
    notIn?: $Enums.RoleScope[] | Prisma.ListEnumRoleScopeFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumRoleScopeWithAggregatesFilter<$PrismaModel> | $Enums.RoleScope;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _min?: Prisma.NestedEnumRoleScopeFilter<$PrismaModel>;
    _max?: Prisma.NestedEnumRoleScopeFilter<$PrismaModel>;
};
export type BoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | Prisma.BooleanFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedBoolWithAggregatesFilter<$PrismaModel> | boolean;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _min?: Prisma.NestedBoolFilter<$PrismaModel>;
    _max?: Prisma.NestedBoolFilter<$PrismaModel>;
};
export type EnumPermissionScopeFilter<$PrismaModel = never> = {
    equals?: $Enums.PermissionScope | Prisma.EnumPermissionScopeFieldRefInput<$PrismaModel>;
    in?: $Enums.PermissionScope[] | Prisma.ListEnumPermissionScopeFieldRefInput<$PrismaModel>;
    notIn?: $Enums.PermissionScope[] | Prisma.ListEnumPermissionScopeFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumPermissionScopeFilter<$PrismaModel> | $Enums.PermissionScope;
};
export type EnumPermissionScopeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.PermissionScope | Prisma.EnumPermissionScopeFieldRefInput<$PrismaModel>;
    in?: $Enums.PermissionScope[] | Prisma.ListEnumPermissionScopeFieldRefInput<$PrismaModel>;
    notIn?: $Enums.PermissionScope[] | Prisma.ListEnumPermissionScopeFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumPermissionScopeWithAggregatesFilter<$PrismaModel> | $Enums.PermissionScope;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _min?: Prisma.NestedEnumPermissionScopeFilter<$PrismaModel>;
    _max?: Prisma.NestedEnumPermissionScopeFilter<$PrismaModel>;
};
export type EnumOrganizationTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.OrganizationType | Prisma.EnumOrganizationTypeFieldRefInput<$PrismaModel>;
    in?: $Enums.OrganizationType[] | Prisma.ListEnumOrganizationTypeFieldRefInput<$PrismaModel>;
    notIn?: $Enums.OrganizationType[] | Prisma.ListEnumOrganizationTypeFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumOrganizationTypeFilter<$PrismaModel> | $Enums.OrganizationType;
};
export type DecimalNullableFilter<$PrismaModel = never> = {
    equals?: runtime.Decimal | runtime.DecimalJsLike | number | string | Prisma.DecimalFieldRefInput<$PrismaModel> | null;
    in?: runtime.Decimal[] | runtime.DecimalJsLike[] | number[] | string[] | Prisma.ListDecimalFieldRefInput<$PrismaModel> | null;
    notIn?: runtime.Decimal[] | runtime.DecimalJsLike[] | number[] | string[] | Prisma.ListDecimalFieldRefInput<$PrismaModel> | null;
    lt?: runtime.Decimal | runtime.DecimalJsLike | number | string | Prisma.DecimalFieldRefInput<$PrismaModel>;
    lte?: runtime.Decimal | runtime.DecimalJsLike | number | string | Prisma.DecimalFieldRefInput<$PrismaModel>;
    gt?: runtime.Decimal | runtime.DecimalJsLike | number | string | Prisma.DecimalFieldRefInput<$PrismaModel>;
    gte?: runtime.Decimal | runtime.DecimalJsLike | number | string | Prisma.DecimalFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedDecimalNullableFilter<$PrismaModel> | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
};
export type IntNullableFilter<$PrismaModel = never> = {
    equals?: number | Prisma.IntFieldRefInput<$PrismaModel> | null;
    in?: number[] | Prisma.ListIntFieldRefInput<$PrismaModel> | null;
    notIn?: number[] | Prisma.ListIntFieldRefInput<$PrismaModel> | null;
    lt?: number | Prisma.IntFieldRefInput<$PrismaModel>;
    lte?: number | Prisma.IntFieldRefInput<$PrismaModel>;
    gt?: number | Prisma.IntFieldRefInput<$PrismaModel>;
    gte?: number | Prisma.IntFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedIntNullableFilter<$PrismaModel> | number | null;
};
export type EnumVerificationStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.VerificationStatus | Prisma.EnumVerificationStatusFieldRefInput<$PrismaModel>;
    in?: $Enums.VerificationStatus[] | Prisma.ListEnumVerificationStatusFieldRefInput<$PrismaModel>;
    notIn?: $Enums.VerificationStatus[] | Prisma.ListEnumVerificationStatusFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumVerificationStatusFilter<$PrismaModel> | $Enums.VerificationStatus;
};
export type EnumOrganizationStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.OrganizationStatus | Prisma.EnumOrganizationStatusFieldRefInput<$PrismaModel>;
    in?: $Enums.OrganizationStatus[] | Prisma.ListEnumOrganizationStatusFieldRefInput<$PrismaModel>;
    notIn?: $Enums.OrganizationStatus[] | Prisma.ListEnumOrganizationStatusFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumOrganizationStatusFilter<$PrismaModel> | $Enums.OrganizationStatus;
};
export type EnumOrganizationTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.OrganizationType | Prisma.EnumOrganizationTypeFieldRefInput<$PrismaModel>;
    in?: $Enums.OrganizationType[] | Prisma.ListEnumOrganizationTypeFieldRefInput<$PrismaModel>;
    notIn?: $Enums.OrganizationType[] | Prisma.ListEnumOrganizationTypeFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumOrganizationTypeWithAggregatesFilter<$PrismaModel> | $Enums.OrganizationType;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _min?: Prisma.NestedEnumOrganizationTypeFilter<$PrismaModel>;
    _max?: Prisma.NestedEnumOrganizationTypeFilter<$PrismaModel>;
};
export type DecimalNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: runtime.Decimal | runtime.DecimalJsLike | number | string | Prisma.DecimalFieldRefInput<$PrismaModel> | null;
    in?: runtime.Decimal[] | runtime.DecimalJsLike[] | number[] | string[] | Prisma.ListDecimalFieldRefInput<$PrismaModel> | null;
    notIn?: runtime.Decimal[] | runtime.DecimalJsLike[] | number[] | string[] | Prisma.ListDecimalFieldRefInput<$PrismaModel> | null;
    lt?: runtime.Decimal | runtime.DecimalJsLike | number | string | Prisma.DecimalFieldRefInput<$PrismaModel>;
    lte?: runtime.Decimal | runtime.DecimalJsLike | number | string | Prisma.DecimalFieldRefInput<$PrismaModel>;
    gt?: runtime.Decimal | runtime.DecimalJsLike | number | string | Prisma.DecimalFieldRefInput<$PrismaModel>;
    gte?: runtime.Decimal | runtime.DecimalJsLike | number | string | Prisma.DecimalFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedDecimalNullableWithAggregatesFilter<$PrismaModel> | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    _count?: Prisma.NestedIntNullableFilter<$PrismaModel>;
    _avg?: Prisma.NestedDecimalNullableFilter<$PrismaModel>;
    _sum?: Prisma.NestedDecimalNullableFilter<$PrismaModel>;
    _min?: Prisma.NestedDecimalNullableFilter<$PrismaModel>;
    _max?: Prisma.NestedDecimalNullableFilter<$PrismaModel>;
};
export type IntNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | Prisma.IntFieldRefInput<$PrismaModel> | null;
    in?: number[] | Prisma.ListIntFieldRefInput<$PrismaModel> | null;
    notIn?: number[] | Prisma.ListIntFieldRefInput<$PrismaModel> | null;
    lt?: number | Prisma.IntFieldRefInput<$PrismaModel>;
    lte?: number | Prisma.IntFieldRefInput<$PrismaModel>;
    gt?: number | Prisma.IntFieldRefInput<$PrismaModel>;
    gte?: number | Prisma.IntFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedIntNullableWithAggregatesFilter<$PrismaModel> | number | null;
    _count?: Prisma.NestedIntNullableFilter<$PrismaModel>;
    _avg?: Prisma.NestedFloatNullableFilter<$PrismaModel>;
    _sum?: Prisma.NestedIntNullableFilter<$PrismaModel>;
    _min?: Prisma.NestedIntNullableFilter<$PrismaModel>;
    _max?: Prisma.NestedIntNullableFilter<$PrismaModel>;
};
export type EnumVerificationStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.VerificationStatus | Prisma.EnumVerificationStatusFieldRefInput<$PrismaModel>;
    in?: $Enums.VerificationStatus[] | Prisma.ListEnumVerificationStatusFieldRefInput<$PrismaModel>;
    notIn?: $Enums.VerificationStatus[] | Prisma.ListEnumVerificationStatusFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumVerificationStatusWithAggregatesFilter<$PrismaModel> | $Enums.VerificationStatus;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _min?: Prisma.NestedEnumVerificationStatusFilter<$PrismaModel>;
    _max?: Prisma.NestedEnumVerificationStatusFilter<$PrismaModel>;
};
export type EnumOrganizationStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.OrganizationStatus | Prisma.EnumOrganizationStatusFieldRefInput<$PrismaModel>;
    in?: $Enums.OrganizationStatus[] | Prisma.ListEnumOrganizationStatusFieldRefInput<$PrismaModel>;
    notIn?: $Enums.OrganizationStatus[] | Prisma.ListEnumOrganizationStatusFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumOrganizationStatusWithAggregatesFilter<$PrismaModel> | $Enums.OrganizationStatus;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _min?: Prisma.NestedEnumOrganizationStatusFilter<$PrismaModel>;
    _max?: Prisma.NestedEnumOrganizationStatusFilter<$PrismaModel>;
};
export type EnumMembershipStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.MembershipStatus | Prisma.EnumMembershipStatusFieldRefInput<$PrismaModel>;
    in?: $Enums.MembershipStatus[] | Prisma.ListEnumMembershipStatusFieldRefInput<$PrismaModel>;
    notIn?: $Enums.MembershipStatus[] | Prisma.ListEnumMembershipStatusFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumMembershipStatusFilter<$PrismaModel> | $Enums.MembershipStatus;
};
export type EnumMembershipStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.MembershipStatus | Prisma.EnumMembershipStatusFieldRefInput<$PrismaModel>;
    in?: $Enums.MembershipStatus[] | Prisma.ListEnumMembershipStatusFieldRefInput<$PrismaModel>;
    notIn?: $Enums.MembershipStatus[] | Prisma.ListEnumMembershipStatusFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumMembershipStatusWithAggregatesFilter<$PrismaModel> | $Enums.MembershipStatus;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _min?: Prisma.NestedEnumMembershipStatusFilter<$PrismaModel>;
    _max?: Prisma.NestedEnumMembershipStatusFilter<$PrismaModel>;
};
export type EnumInvitationStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.InvitationStatus | Prisma.EnumInvitationStatusFieldRefInput<$PrismaModel>;
    in?: $Enums.InvitationStatus[] | Prisma.ListEnumInvitationStatusFieldRefInput<$PrismaModel>;
    notIn?: $Enums.InvitationStatus[] | Prisma.ListEnumInvitationStatusFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumInvitationStatusFilter<$PrismaModel> | $Enums.InvitationStatus;
};
export type EnumInvitationStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.InvitationStatus | Prisma.EnumInvitationStatusFieldRefInput<$PrismaModel>;
    in?: $Enums.InvitationStatus[] | Prisma.ListEnumInvitationStatusFieldRefInput<$PrismaModel>;
    notIn?: $Enums.InvitationStatus[] | Prisma.ListEnumInvitationStatusFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumInvitationStatusWithAggregatesFilter<$PrismaModel> | $Enums.InvitationStatus;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _min?: Prisma.NestedEnumInvitationStatusFilter<$PrismaModel>;
    _max?: Prisma.NestedEnumInvitationStatusFilter<$PrismaModel>;
};
export type EnumTransportTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.TransportType | Prisma.EnumTransportTypeFieldRefInput<$PrismaModel>;
    in?: $Enums.TransportType[] | Prisma.ListEnumTransportTypeFieldRefInput<$PrismaModel>;
    notIn?: $Enums.TransportType[] | Prisma.ListEnumTransportTypeFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumTransportTypeFilter<$PrismaModel> | $Enums.TransportType;
};
export type EnumTransportTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.TransportType | Prisma.EnumTransportTypeFieldRefInput<$PrismaModel>;
    in?: $Enums.TransportType[] | Prisma.ListEnumTransportTypeFieldRefInput<$PrismaModel>;
    notIn?: $Enums.TransportType[] | Prisma.ListEnumTransportTypeFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumTransportTypeWithAggregatesFilter<$PrismaModel> | $Enums.TransportType;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _min?: Prisma.NestedEnumTransportTypeFilter<$PrismaModel>;
    _max?: Prisma.NestedEnumTransportTypeFilter<$PrismaModel>;
};
export type EnumFoodCategoryFilter<$PrismaModel = never> = {
    equals?: $Enums.FoodCategory | Prisma.EnumFoodCategoryFieldRefInput<$PrismaModel>;
    in?: $Enums.FoodCategory[] | Prisma.ListEnumFoodCategoryFieldRefInput<$PrismaModel>;
    notIn?: $Enums.FoodCategory[] | Prisma.ListEnumFoodCategoryFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumFoodCategoryFilter<$PrismaModel> | $Enums.FoodCategory;
};
export type EnumFoodTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.FoodType | Prisma.EnumFoodTypeFieldRefInput<$PrismaModel>;
    in?: $Enums.FoodType[] | Prisma.ListEnumFoodTypeFieldRefInput<$PrismaModel>;
    notIn?: $Enums.FoodType[] | Prisma.ListEnumFoodTypeFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumFoodTypeFilter<$PrismaModel> | $Enums.FoodType;
};
export type DecimalFilter<$PrismaModel = never> = {
    equals?: runtime.Decimal | runtime.DecimalJsLike | number | string | Prisma.DecimalFieldRefInput<$PrismaModel>;
    in?: runtime.Decimal[] | runtime.DecimalJsLike[] | number[] | string[] | Prisma.ListDecimalFieldRefInput<$PrismaModel>;
    notIn?: runtime.Decimal[] | runtime.DecimalJsLike[] | number[] | string[] | Prisma.ListDecimalFieldRefInput<$PrismaModel>;
    lt?: runtime.Decimal | runtime.DecimalJsLike | number | string | Prisma.DecimalFieldRefInput<$PrismaModel>;
    lte?: runtime.Decimal | runtime.DecimalJsLike | number | string | Prisma.DecimalFieldRefInput<$PrismaModel>;
    gt?: runtime.Decimal | runtime.DecimalJsLike | number | string | Prisma.DecimalFieldRefInput<$PrismaModel>;
    gte?: runtime.Decimal | runtime.DecimalJsLike | number | string | Prisma.DecimalFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedDecimalFilter<$PrismaModel> | runtime.Decimal | runtime.DecimalJsLike | number | string;
};
export type EnumFoodUnitFilter<$PrismaModel = never> = {
    equals?: $Enums.FoodUnit | Prisma.EnumFoodUnitFieldRefInput<$PrismaModel>;
    in?: $Enums.FoodUnit[] | Prisma.ListEnumFoodUnitFieldRefInput<$PrismaModel>;
    notIn?: $Enums.FoodUnit[] | Prisma.ListEnumFoodUnitFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumFoodUnitFilter<$PrismaModel> | $Enums.FoodUnit;
};
export type EnumStorageTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.StorageType | Prisma.EnumStorageTypeFieldRefInput<$PrismaModel>;
    in?: $Enums.StorageType[] | Prisma.ListEnumStorageTypeFieldRefInput<$PrismaModel>;
    notIn?: $Enums.StorageType[] | Prisma.ListEnumStorageTypeFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumStorageTypeFilter<$PrismaModel> | $Enums.StorageType;
};
export type EnumDonationStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.DonationStatus | Prisma.EnumDonationStatusFieldRefInput<$PrismaModel>;
    in?: $Enums.DonationStatus[] | Prisma.ListEnumDonationStatusFieldRefInput<$PrismaModel>;
    notIn?: $Enums.DonationStatus[] | Prisma.ListEnumDonationStatusFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumDonationStatusFilter<$PrismaModel> | $Enums.DonationStatus;
};
export type EnumFoodCategoryWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.FoodCategory | Prisma.EnumFoodCategoryFieldRefInput<$PrismaModel>;
    in?: $Enums.FoodCategory[] | Prisma.ListEnumFoodCategoryFieldRefInput<$PrismaModel>;
    notIn?: $Enums.FoodCategory[] | Prisma.ListEnumFoodCategoryFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumFoodCategoryWithAggregatesFilter<$PrismaModel> | $Enums.FoodCategory;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _min?: Prisma.NestedEnumFoodCategoryFilter<$PrismaModel>;
    _max?: Prisma.NestedEnumFoodCategoryFilter<$PrismaModel>;
};
export type EnumFoodTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.FoodType | Prisma.EnumFoodTypeFieldRefInput<$PrismaModel>;
    in?: $Enums.FoodType[] | Prisma.ListEnumFoodTypeFieldRefInput<$PrismaModel>;
    notIn?: $Enums.FoodType[] | Prisma.ListEnumFoodTypeFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumFoodTypeWithAggregatesFilter<$PrismaModel> | $Enums.FoodType;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _min?: Prisma.NestedEnumFoodTypeFilter<$PrismaModel>;
    _max?: Prisma.NestedEnumFoodTypeFilter<$PrismaModel>;
};
export type DecimalWithAggregatesFilter<$PrismaModel = never> = {
    equals?: runtime.Decimal | runtime.DecimalJsLike | number | string | Prisma.DecimalFieldRefInput<$PrismaModel>;
    in?: runtime.Decimal[] | runtime.DecimalJsLike[] | number[] | string[] | Prisma.ListDecimalFieldRefInput<$PrismaModel>;
    notIn?: runtime.Decimal[] | runtime.DecimalJsLike[] | number[] | string[] | Prisma.ListDecimalFieldRefInput<$PrismaModel>;
    lt?: runtime.Decimal | runtime.DecimalJsLike | number | string | Prisma.DecimalFieldRefInput<$PrismaModel>;
    lte?: runtime.Decimal | runtime.DecimalJsLike | number | string | Prisma.DecimalFieldRefInput<$PrismaModel>;
    gt?: runtime.Decimal | runtime.DecimalJsLike | number | string | Prisma.DecimalFieldRefInput<$PrismaModel>;
    gte?: runtime.Decimal | runtime.DecimalJsLike | number | string | Prisma.DecimalFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedDecimalWithAggregatesFilter<$PrismaModel> | runtime.Decimal | runtime.DecimalJsLike | number | string;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _avg?: Prisma.NestedDecimalFilter<$PrismaModel>;
    _sum?: Prisma.NestedDecimalFilter<$PrismaModel>;
    _min?: Prisma.NestedDecimalFilter<$PrismaModel>;
    _max?: Prisma.NestedDecimalFilter<$PrismaModel>;
};
export type EnumFoodUnitWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.FoodUnit | Prisma.EnumFoodUnitFieldRefInput<$PrismaModel>;
    in?: $Enums.FoodUnit[] | Prisma.ListEnumFoodUnitFieldRefInput<$PrismaModel>;
    notIn?: $Enums.FoodUnit[] | Prisma.ListEnumFoodUnitFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumFoodUnitWithAggregatesFilter<$PrismaModel> | $Enums.FoodUnit;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _min?: Prisma.NestedEnumFoodUnitFilter<$PrismaModel>;
    _max?: Prisma.NestedEnumFoodUnitFilter<$PrismaModel>;
};
export type EnumStorageTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.StorageType | Prisma.EnumStorageTypeFieldRefInput<$PrismaModel>;
    in?: $Enums.StorageType[] | Prisma.ListEnumStorageTypeFieldRefInput<$PrismaModel>;
    notIn?: $Enums.StorageType[] | Prisma.ListEnumStorageTypeFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumStorageTypeWithAggregatesFilter<$PrismaModel> | $Enums.StorageType;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _min?: Prisma.NestedEnumStorageTypeFilter<$PrismaModel>;
    _max?: Prisma.NestedEnumStorageTypeFilter<$PrismaModel>;
};
export type EnumDonationStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.DonationStatus | Prisma.EnumDonationStatusFieldRefInput<$PrismaModel>;
    in?: $Enums.DonationStatus[] | Prisma.ListEnumDonationStatusFieldRefInput<$PrismaModel>;
    notIn?: $Enums.DonationStatus[] | Prisma.ListEnumDonationStatusFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumDonationStatusWithAggregatesFilter<$PrismaModel> | $Enums.DonationStatus;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _min?: Prisma.NestedEnumDonationStatusFilter<$PrismaModel>;
    _max?: Prisma.NestedEnumDonationStatusFilter<$PrismaModel>;
};
export type EnumSafetyCheckResultFilter<$PrismaModel = never> = {
    equals?: $Enums.SafetyCheckResult | Prisma.EnumSafetyCheckResultFieldRefInput<$PrismaModel>;
    in?: $Enums.SafetyCheckResult[] | Prisma.ListEnumSafetyCheckResultFieldRefInput<$PrismaModel>;
    notIn?: $Enums.SafetyCheckResult[] | Prisma.ListEnumSafetyCheckResultFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumSafetyCheckResultFilter<$PrismaModel> | $Enums.SafetyCheckResult;
};
export type EnumSafetyCheckResultWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.SafetyCheckResult | Prisma.EnumSafetyCheckResultFieldRefInput<$PrismaModel>;
    in?: $Enums.SafetyCheckResult[] | Prisma.ListEnumSafetyCheckResultFieldRefInput<$PrismaModel>;
    notIn?: $Enums.SafetyCheckResult[] | Prisma.ListEnumSafetyCheckResultFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumSafetyCheckResultWithAggregatesFilter<$PrismaModel> | $Enums.SafetyCheckResult;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _min?: Prisma.NestedEnumSafetyCheckResultFilter<$PrismaModel>;
    _max?: Prisma.NestedEnumSafetyCheckResultFilter<$PrismaModel>;
};
export type EnumPickupModeFilter<$PrismaModel = never> = {
    equals?: $Enums.PickupMode | Prisma.EnumPickupModeFieldRefInput<$PrismaModel>;
    in?: $Enums.PickupMode[] | Prisma.ListEnumPickupModeFieldRefInput<$PrismaModel>;
    notIn?: $Enums.PickupMode[] | Prisma.ListEnumPickupModeFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumPickupModeFilter<$PrismaModel> | $Enums.PickupMode;
};
export type EnumClaimStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.ClaimStatus | Prisma.EnumClaimStatusFieldRefInput<$PrismaModel>;
    in?: $Enums.ClaimStatus[] | Prisma.ListEnumClaimStatusFieldRefInput<$PrismaModel>;
    notIn?: $Enums.ClaimStatus[] | Prisma.ListEnumClaimStatusFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumClaimStatusFilter<$PrismaModel> | $Enums.ClaimStatus;
};
export type EnumPickupModeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.PickupMode | Prisma.EnumPickupModeFieldRefInput<$PrismaModel>;
    in?: $Enums.PickupMode[] | Prisma.ListEnumPickupModeFieldRefInput<$PrismaModel>;
    notIn?: $Enums.PickupMode[] | Prisma.ListEnumPickupModeFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumPickupModeWithAggregatesFilter<$PrismaModel> | $Enums.PickupMode;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _min?: Prisma.NestedEnumPickupModeFilter<$PrismaModel>;
    _max?: Prisma.NestedEnumPickupModeFilter<$PrismaModel>;
};
export type EnumClaimStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.ClaimStatus | Prisma.EnumClaimStatusFieldRefInput<$PrismaModel>;
    in?: $Enums.ClaimStatus[] | Prisma.ListEnumClaimStatusFieldRefInput<$PrismaModel>;
    notIn?: $Enums.ClaimStatus[] | Prisma.ListEnumClaimStatusFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumClaimStatusWithAggregatesFilter<$PrismaModel> | $Enums.ClaimStatus;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _min?: Prisma.NestedEnumClaimStatusFilter<$PrismaModel>;
    _max?: Prisma.NestedEnumClaimStatusFilter<$PrismaModel>;
};
export type EnumRequestPriorityFilter<$PrismaModel = never> = {
    equals?: $Enums.RequestPriority | Prisma.EnumRequestPriorityFieldRefInput<$PrismaModel>;
    in?: $Enums.RequestPriority[] | Prisma.ListEnumRequestPriorityFieldRefInput<$PrismaModel>;
    notIn?: $Enums.RequestPriority[] | Prisma.ListEnumRequestPriorityFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumRequestPriorityFilter<$PrismaModel> | $Enums.RequestPriority;
};
export type EnumFoodRequestStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.FoodRequestStatus | Prisma.EnumFoodRequestStatusFieldRefInput<$PrismaModel>;
    in?: $Enums.FoodRequestStatus[] | Prisma.ListEnumFoodRequestStatusFieldRefInput<$PrismaModel>;
    notIn?: $Enums.FoodRequestStatus[] | Prisma.ListEnumFoodRequestStatusFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumFoodRequestStatusFilter<$PrismaModel> | $Enums.FoodRequestStatus;
};
export type EnumRequestPriorityWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.RequestPriority | Prisma.EnumRequestPriorityFieldRefInput<$PrismaModel>;
    in?: $Enums.RequestPriority[] | Prisma.ListEnumRequestPriorityFieldRefInput<$PrismaModel>;
    notIn?: $Enums.RequestPriority[] | Prisma.ListEnumRequestPriorityFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumRequestPriorityWithAggregatesFilter<$PrismaModel> | $Enums.RequestPriority;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _min?: Prisma.NestedEnumRequestPriorityFilter<$PrismaModel>;
    _max?: Prisma.NestedEnumRequestPriorityFilter<$PrismaModel>;
};
export type EnumFoodRequestStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.FoodRequestStatus | Prisma.EnumFoodRequestStatusFieldRefInput<$PrismaModel>;
    in?: $Enums.FoodRequestStatus[] | Prisma.ListEnumFoodRequestStatusFieldRefInput<$PrismaModel>;
    notIn?: $Enums.FoodRequestStatus[] | Prisma.ListEnumFoodRequestStatusFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumFoodRequestStatusWithAggregatesFilter<$PrismaModel> | $Enums.FoodRequestStatus;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _min?: Prisma.NestedEnumFoodRequestStatusFilter<$PrismaModel>;
    _max?: Prisma.NestedEnumFoodRequestStatusFilter<$PrismaModel>;
};
export type EnumFulfillmentStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.FulfillmentStatus | Prisma.EnumFulfillmentStatusFieldRefInput<$PrismaModel>;
    in?: $Enums.FulfillmentStatus[] | Prisma.ListEnumFulfillmentStatusFieldRefInput<$PrismaModel>;
    notIn?: $Enums.FulfillmentStatus[] | Prisma.ListEnumFulfillmentStatusFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumFulfillmentStatusFilter<$PrismaModel> | $Enums.FulfillmentStatus;
};
export type EnumFulfillmentStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.FulfillmentStatus | Prisma.EnumFulfillmentStatusFieldRefInput<$PrismaModel>;
    in?: $Enums.FulfillmentStatus[] | Prisma.ListEnumFulfillmentStatusFieldRefInput<$PrismaModel>;
    notIn?: $Enums.FulfillmentStatus[] | Prisma.ListEnumFulfillmentStatusFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumFulfillmentStatusWithAggregatesFilter<$PrismaModel> | $Enums.FulfillmentStatus;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _min?: Prisma.NestedEnumFulfillmentStatusFilter<$PrismaModel>;
    _max?: Prisma.NestedEnumFulfillmentStatusFilter<$PrismaModel>;
};
export type EnumDeliveryStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.DeliveryStatus | Prisma.EnumDeliveryStatusFieldRefInput<$PrismaModel>;
    in?: $Enums.DeliveryStatus[] | Prisma.ListEnumDeliveryStatusFieldRefInput<$PrismaModel>;
    notIn?: $Enums.DeliveryStatus[] | Prisma.ListEnumDeliveryStatusFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumDeliveryStatusFilter<$PrismaModel> | $Enums.DeliveryStatus;
};
export type EnumDeliveryStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.DeliveryStatus | Prisma.EnumDeliveryStatusFieldRefInput<$PrismaModel>;
    in?: $Enums.DeliveryStatus[] | Prisma.ListEnumDeliveryStatusFieldRefInput<$PrismaModel>;
    notIn?: $Enums.DeliveryStatus[] | Prisma.ListEnumDeliveryStatusFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumDeliveryStatusWithAggregatesFilter<$PrismaModel> | $Enums.DeliveryStatus;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _min?: Prisma.NestedEnumDeliveryStatusFilter<$PrismaModel>;
    _max?: Prisma.NestedEnumDeliveryStatusFilter<$PrismaModel>;
};
export type EnumReviewTargetTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.ReviewTargetType | Prisma.EnumReviewTargetTypeFieldRefInput<$PrismaModel>;
    in?: $Enums.ReviewTargetType[] | Prisma.ListEnumReviewTargetTypeFieldRefInput<$PrismaModel>;
    notIn?: $Enums.ReviewTargetType[] | Prisma.ListEnumReviewTargetTypeFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumReviewTargetTypeFilter<$PrismaModel> | $Enums.ReviewTargetType;
};
export type JsonNullableFilter<$PrismaModel = never> = Prisma.PatchUndefined<Prisma.Either<Required<JsonNullableFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonNullableFilterBase<$PrismaModel>>, 'path'>>, Required<JsonNullableFilterBase<$PrismaModel>>> | Prisma.OptionalFlat<Omit<Required<JsonNullableFilterBase<$PrismaModel>>, 'path'>>;
export type JsonNullableFilterBase<$PrismaModel = never> = {
    equals?: runtime.InputJsonValue | Prisma.JsonFieldRefInput<$PrismaModel> | Prisma.JsonNullValueFilter;
    path?: string[];
    mode?: Prisma.QueryMode | Prisma.EnumQueryModeFieldRefInput<$PrismaModel>;
    string_contains?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    string_starts_with?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    string_ends_with?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    array_starts_with?: runtime.InputJsonValue | Prisma.JsonFieldRefInput<$PrismaModel> | null;
    array_ends_with?: runtime.InputJsonValue | Prisma.JsonFieldRefInput<$PrismaModel> | null;
    array_contains?: runtime.InputJsonValue | Prisma.JsonFieldRefInput<$PrismaModel> | null;
    lt?: runtime.InputJsonValue | Prisma.JsonFieldRefInput<$PrismaModel>;
    lte?: runtime.InputJsonValue | Prisma.JsonFieldRefInput<$PrismaModel>;
    gt?: runtime.InputJsonValue | Prisma.JsonFieldRefInput<$PrismaModel>;
    gte?: runtime.InputJsonValue | Prisma.JsonFieldRefInput<$PrismaModel>;
    not?: runtime.InputJsonValue | Prisma.JsonFieldRefInput<$PrismaModel> | Prisma.JsonNullValueFilter;
};
export type EnumReviewTargetTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.ReviewTargetType | Prisma.EnumReviewTargetTypeFieldRefInput<$PrismaModel>;
    in?: $Enums.ReviewTargetType[] | Prisma.ListEnumReviewTargetTypeFieldRefInput<$PrismaModel>;
    notIn?: $Enums.ReviewTargetType[] | Prisma.ListEnumReviewTargetTypeFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumReviewTargetTypeWithAggregatesFilter<$PrismaModel> | $Enums.ReviewTargetType;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _min?: Prisma.NestedEnumReviewTargetTypeFilter<$PrismaModel>;
    _max?: Prisma.NestedEnumReviewTargetTypeFilter<$PrismaModel>;
};
export type JsonNullableWithAggregatesFilter<$PrismaModel = never> = Prisma.PatchUndefined<Prisma.Either<Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>, 'path'>>, Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>> | Prisma.OptionalFlat<Omit<Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>, 'path'>>;
export type JsonNullableWithAggregatesFilterBase<$PrismaModel = never> = {
    equals?: runtime.InputJsonValue | Prisma.JsonFieldRefInput<$PrismaModel> | Prisma.JsonNullValueFilter;
    path?: string[];
    mode?: Prisma.QueryMode | Prisma.EnumQueryModeFieldRefInput<$PrismaModel>;
    string_contains?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    string_starts_with?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    string_ends_with?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    array_starts_with?: runtime.InputJsonValue | Prisma.JsonFieldRefInput<$PrismaModel> | null;
    array_ends_with?: runtime.InputJsonValue | Prisma.JsonFieldRefInput<$PrismaModel> | null;
    array_contains?: runtime.InputJsonValue | Prisma.JsonFieldRefInput<$PrismaModel> | null;
    lt?: runtime.InputJsonValue | Prisma.JsonFieldRefInput<$PrismaModel>;
    lte?: runtime.InputJsonValue | Prisma.JsonFieldRefInput<$PrismaModel>;
    gt?: runtime.InputJsonValue | Prisma.JsonFieldRefInput<$PrismaModel>;
    gte?: runtime.InputJsonValue | Prisma.JsonFieldRefInput<$PrismaModel>;
    not?: runtime.InputJsonValue | Prisma.JsonFieldRefInput<$PrismaModel> | Prisma.JsonNullValueFilter;
    _count?: Prisma.NestedIntNullableFilter<$PrismaModel>;
    _min?: Prisma.NestedJsonNullableFilter<$PrismaModel>;
    _max?: Prisma.NestedJsonNullableFilter<$PrismaModel>;
};
export type EnumAdminRoleTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.AdminRoleType | Prisma.EnumAdminRoleTypeFieldRefInput<$PrismaModel>;
    in?: $Enums.AdminRoleType[] | Prisma.ListEnumAdminRoleTypeFieldRefInput<$PrismaModel>;
    notIn?: $Enums.AdminRoleType[] | Prisma.ListEnumAdminRoleTypeFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumAdminRoleTypeFilter<$PrismaModel> | $Enums.AdminRoleType;
};
export type EnumAdminRoleTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.AdminRoleType | Prisma.EnumAdminRoleTypeFieldRefInput<$PrismaModel>;
    in?: $Enums.AdminRoleType[] | Prisma.ListEnumAdminRoleTypeFieldRefInput<$PrismaModel>;
    notIn?: $Enums.AdminRoleType[] | Prisma.ListEnumAdminRoleTypeFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumAdminRoleTypeWithAggregatesFilter<$PrismaModel> | $Enums.AdminRoleType;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _min?: Prisma.NestedEnumAdminRoleTypeFilter<$PrismaModel>;
    _max?: Prisma.NestedEnumAdminRoleTypeFilter<$PrismaModel>;
};
export type EnumDevicePlatformFilter<$PrismaModel = never> = {
    equals?: $Enums.DevicePlatform | Prisma.EnumDevicePlatformFieldRefInput<$PrismaModel>;
    in?: $Enums.DevicePlatform[] | Prisma.ListEnumDevicePlatformFieldRefInput<$PrismaModel>;
    notIn?: $Enums.DevicePlatform[] | Prisma.ListEnumDevicePlatformFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumDevicePlatformFilter<$PrismaModel> | $Enums.DevicePlatform;
};
export type EnumDevicePlatformWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.DevicePlatform | Prisma.EnumDevicePlatformFieldRefInput<$PrismaModel>;
    in?: $Enums.DevicePlatform[] | Prisma.ListEnumDevicePlatformFieldRefInput<$PrismaModel>;
    notIn?: $Enums.DevicePlatform[] | Prisma.ListEnumDevicePlatformFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumDevicePlatformWithAggregatesFilter<$PrismaModel> | $Enums.DevicePlatform;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _min?: Prisma.NestedEnumDevicePlatformFilter<$PrismaModel>;
    _max?: Prisma.NestedEnumDevicePlatformFilter<$PrismaModel>;
};
export type JsonFilter<$PrismaModel = never> = Prisma.PatchUndefined<Prisma.Either<Required<JsonFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonFilterBase<$PrismaModel>>, 'path'>>, Required<JsonFilterBase<$PrismaModel>>> | Prisma.OptionalFlat<Omit<Required<JsonFilterBase<$PrismaModel>>, 'path'>>;
export type JsonFilterBase<$PrismaModel = never> = {
    equals?: runtime.InputJsonValue | Prisma.JsonFieldRefInput<$PrismaModel> | Prisma.JsonNullValueFilter;
    path?: string[];
    mode?: Prisma.QueryMode | Prisma.EnumQueryModeFieldRefInput<$PrismaModel>;
    string_contains?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    string_starts_with?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    string_ends_with?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    array_starts_with?: runtime.InputJsonValue | Prisma.JsonFieldRefInput<$PrismaModel> | null;
    array_ends_with?: runtime.InputJsonValue | Prisma.JsonFieldRefInput<$PrismaModel> | null;
    array_contains?: runtime.InputJsonValue | Prisma.JsonFieldRefInput<$PrismaModel> | null;
    lt?: runtime.InputJsonValue | Prisma.JsonFieldRefInput<$PrismaModel>;
    lte?: runtime.InputJsonValue | Prisma.JsonFieldRefInput<$PrismaModel>;
    gt?: runtime.InputJsonValue | Prisma.JsonFieldRefInput<$PrismaModel>;
    gte?: runtime.InputJsonValue | Prisma.JsonFieldRefInput<$PrismaModel>;
    not?: runtime.InputJsonValue | Prisma.JsonFieldRefInput<$PrismaModel> | Prisma.JsonNullValueFilter;
};
export type JsonWithAggregatesFilter<$PrismaModel = never> = Prisma.PatchUndefined<Prisma.Either<Required<JsonWithAggregatesFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonWithAggregatesFilterBase<$PrismaModel>>, 'path'>>, Required<JsonWithAggregatesFilterBase<$PrismaModel>>> | Prisma.OptionalFlat<Omit<Required<JsonWithAggregatesFilterBase<$PrismaModel>>, 'path'>>;
export type JsonWithAggregatesFilterBase<$PrismaModel = never> = {
    equals?: runtime.InputJsonValue | Prisma.JsonFieldRefInput<$PrismaModel> | Prisma.JsonNullValueFilter;
    path?: string[];
    mode?: Prisma.QueryMode | Prisma.EnumQueryModeFieldRefInput<$PrismaModel>;
    string_contains?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    string_starts_with?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    string_ends_with?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    array_starts_with?: runtime.InputJsonValue | Prisma.JsonFieldRefInput<$PrismaModel> | null;
    array_ends_with?: runtime.InputJsonValue | Prisma.JsonFieldRefInput<$PrismaModel> | null;
    array_contains?: runtime.InputJsonValue | Prisma.JsonFieldRefInput<$PrismaModel> | null;
    lt?: runtime.InputJsonValue | Prisma.JsonFieldRefInput<$PrismaModel>;
    lte?: runtime.InputJsonValue | Prisma.JsonFieldRefInput<$PrismaModel>;
    gt?: runtime.InputJsonValue | Prisma.JsonFieldRefInput<$PrismaModel>;
    gte?: runtime.InputJsonValue | Prisma.JsonFieldRefInput<$PrismaModel>;
    not?: runtime.InputJsonValue | Prisma.JsonFieldRefInput<$PrismaModel> | Prisma.JsonNullValueFilter;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _min?: Prisma.NestedJsonFilter<$PrismaModel>;
    _max?: Prisma.NestedJsonFilter<$PrismaModel>;
};
export type NestedUuidFilter<$PrismaModel = never> = {
    equals?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    in?: string[] | Prisma.ListStringFieldRefInput<$PrismaModel>;
    notIn?: string[] | Prisma.ListStringFieldRefInput<$PrismaModel>;
    lt?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    lte?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    gt?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    gte?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedUuidFilter<$PrismaModel> | string;
};
export type NestedStringFilter<$PrismaModel = never> = {
    equals?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    in?: string[] | Prisma.ListStringFieldRefInput<$PrismaModel>;
    notIn?: string[] | Prisma.ListStringFieldRefInput<$PrismaModel>;
    lt?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    lte?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    gt?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    gte?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    contains?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    startsWith?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    endsWith?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedStringFilter<$PrismaModel> | string;
};
export type NestedStringNullableFilter<$PrismaModel = never> = {
    equals?: string | Prisma.StringFieldRefInput<$PrismaModel> | null;
    in?: string[] | Prisma.ListStringFieldRefInput<$PrismaModel> | null;
    notIn?: string[] | Prisma.ListStringFieldRefInput<$PrismaModel> | null;
    lt?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    lte?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    gt?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    gte?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    contains?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    startsWith?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    endsWith?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedStringNullableFilter<$PrismaModel> | string | null;
};
export type NestedEnumUserStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.UserStatus | Prisma.EnumUserStatusFieldRefInput<$PrismaModel>;
    in?: $Enums.UserStatus[] | Prisma.ListEnumUserStatusFieldRefInput<$PrismaModel>;
    notIn?: $Enums.UserStatus[] | Prisma.ListEnumUserStatusFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumUserStatusFilter<$PrismaModel> | $Enums.UserStatus;
};
export type NestedDateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | Prisma.DateTimeFieldRefInput<$PrismaModel> | null;
    in?: Date[] | string[] | Prisma.ListDateTimeFieldRefInput<$PrismaModel> | null;
    notIn?: Date[] | string[] | Prisma.ListDateTimeFieldRefInput<$PrismaModel> | null;
    lt?: Date | string | Prisma.DateTimeFieldRefInput<$PrismaModel>;
    lte?: Date | string | Prisma.DateTimeFieldRefInput<$PrismaModel>;
    gt?: Date | string | Prisma.DateTimeFieldRefInput<$PrismaModel>;
    gte?: Date | string | Prisma.DateTimeFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null;
};
export type NestedUuidNullableFilter<$PrismaModel = never> = {
    equals?: string | Prisma.StringFieldRefInput<$PrismaModel> | null;
    in?: string[] | Prisma.ListStringFieldRefInput<$PrismaModel> | null;
    notIn?: string[] | Prisma.ListStringFieldRefInput<$PrismaModel> | null;
    lt?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    lte?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    gt?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    gte?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedUuidNullableFilter<$PrismaModel> | string | null;
};
export type NestedIntFilter<$PrismaModel = never> = {
    equals?: number | Prisma.IntFieldRefInput<$PrismaModel>;
    in?: number[] | Prisma.ListIntFieldRefInput<$PrismaModel>;
    notIn?: number[] | Prisma.ListIntFieldRefInput<$PrismaModel>;
    lt?: number | Prisma.IntFieldRefInput<$PrismaModel>;
    lte?: number | Prisma.IntFieldRefInput<$PrismaModel>;
    gt?: number | Prisma.IntFieldRefInput<$PrismaModel>;
    gte?: number | Prisma.IntFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedIntFilter<$PrismaModel> | number;
};
export type NestedDateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | Prisma.DateTimeFieldRefInput<$PrismaModel>;
    in?: Date[] | string[] | Prisma.ListDateTimeFieldRefInput<$PrismaModel>;
    notIn?: Date[] | string[] | Prisma.ListDateTimeFieldRefInput<$PrismaModel>;
    lt?: Date | string | Prisma.DateTimeFieldRefInput<$PrismaModel>;
    lte?: Date | string | Prisma.DateTimeFieldRefInput<$PrismaModel>;
    gt?: Date | string | Prisma.DateTimeFieldRefInput<$PrismaModel>;
    gte?: Date | string | Prisma.DateTimeFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedDateTimeFilter<$PrismaModel> | Date | string;
};
export type NestedUuidWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    in?: string[] | Prisma.ListStringFieldRefInput<$PrismaModel>;
    notIn?: string[] | Prisma.ListStringFieldRefInput<$PrismaModel>;
    lt?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    lte?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    gt?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    gte?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedUuidWithAggregatesFilter<$PrismaModel> | string;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _min?: Prisma.NestedStringFilter<$PrismaModel>;
    _max?: Prisma.NestedStringFilter<$PrismaModel>;
};
export type NestedStringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    in?: string[] | Prisma.ListStringFieldRefInput<$PrismaModel>;
    notIn?: string[] | Prisma.ListStringFieldRefInput<$PrismaModel>;
    lt?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    lte?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    gt?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    gte?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    contains?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    startsWith?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    endsWith?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedStringWithAggregatesFilter<$PrismaModel> | string;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _min?: Prisma.NestedStringFilter<$PrismaModel>;
    _max?: Prisma.NestedStringFilter<$PrismaModel>;
};
export type NestedStringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | Prisma.StringFieldRefInput<$PrismaModel> | null;
    in?: string[] | Prisma.ListStringFieldRefInput<$PrismaModel> | null;
    notIn?: string[] | Prisma.ListStringFieldRefInput<$PrismaModel> | null;
    lt?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    lte?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    gt?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    gte?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    contains?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    startsWith?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    endsWith?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null;
    _count?: Prisma.NestedIntNullableFilter<$PrismaModel>;
    _min?: Prisma.NestedStringNullableFilter<$PrismaModel>;
    _max?: Prisma.NestedStringNullableFilter<$PrismaModel>;
};
export type NestedIntNullableFilter<$PrismaModel = never> = {
    equals?: number | Prisma.IntFieldRefInput<$PrismaModel> | null;
    in?: number[] | Prisma.ListIntFieldRefInput<$PrismaModel> | null;
    notIn?: number[] | Prisma.ListIntFieldRefInput<$PrismaModel> | null;
    lt?: number | Prisma.IntFieldRefInput<$PrismaModel>;
    lte?: number | Prisma.IntFieldRefInput<$PrismaModel>;
    gt?: number | Prisma.IntFieldRefInput<$PrismaModel>;
    gte?: number | Prisma.IntFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedIntNullableFilter<$PrismaModel> | number | null;
};
export type NestedEnumUserStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.UserStatus | Prisma.EnumUserStatusFieldRefInput<$PrismaModel>;
    in?: $Enums.UserStatus[] | Prisma.ListEnumUserStatusFieldRefInput<$PrismaModel>;
    notIn?: $Enums.UserStatus[] | Prisma.ListEnumUserStatusFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumUserStatusWithAggregatesFilter<$PrismaModel> | $Enums.UserStatus;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _min?: Prisma.NestedEnumUserStatusFilter<$PrismaModel>;
    _max?: Prisma.NestedEnumUserStatusFilter<$PrismaModel>;
};
export type NestedDateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | Prisma.DateTimeFieldRefInput<$PrismaModel> | null;
    in?: Date[] | string[] | Prisma.ListDateTimeFieldRefInput<$PrismaModel> | null;
    notIn?: Date[] | string[] | Prisma.ListDateTimeFieldRefInput<$PrismaModel> | null;
    lt?: Date | string | Prisma.DateTimeFieldRefInput<$PrismaModel>;
    lte?: Date | string | Prisma.DateTimeFieldRefInput<$PrismaModel>;
    gt?: Date | string | Prisma.DateTimeFieldRefInput<$PrismaModel>;
    gte?: Date | string | Prisma.DateTimeFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null;
    _count?: Prisma.NestedIntNullableFilter<$PrismaModel>;
    _min?: Prisma.NestedDateTimeNullableFilter<$PrismaModel>;
    _max?: Prisma.NestedDateTimeNullableFilter<$PrismaModel>;
};
export type NestedUuidNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | Prisma.StringFieldRefInput<$PrismaModel> | null;
    in?: string[] | Prisma.ListStringFieldRefInput<$PrismaModel> | null;
    notIn?: string[] | Prisma.ListStringFieldRefInput<$PrismaModel> | null;
    lt?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    lte?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    gt?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    gte?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedUuidNullableWithAggregatesFilter<$PrismaModel> | string | null;
    _count?: Prisma.NestedIntNullableFilter<$PrismaModel>;
    _min?: Prisma.NestedStringNullableFilter<$PrismaModel>;
    _max?: Prisma.NestedStringNullableFilter<$PrismaModel>;
};
export type NestedIntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | Prisma.IntFieldRefInput<$PrismaModel>;
    in?: number[] | Prisma.ListIntFieldRefInput<$PrismaModel>;
    notIn?: number[] | Prisma.ListIntFieldRefInput<$PrismaModel>;
    lt?: number | Prisma.IntFieldRefInput<$PrismaModel>;
    lte?: number | Prisma.IntFieldRefInput<$PrismaModel>;
    gt?: number | Prisma.IntFieldRefInput<$PrismaModel>;
    gte?: number | Prisma.IntFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedIntWithAggregatesFilter<$PrismaModel> | number;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _avg?: Prisma.NestedFloatFilter<$PrismaModel>;
    _sum?: Prisma.NestedIntFilter<$PrismaModel>;
    _min?: Prisma.NestedIntFilter<$PrismaModel>;
    _max?: Prisma.NestedIntFilter<$PrismaModel>;
};
export type NestedFloatFilter<$PrismaModel = never> = {
    equals?: number | Prisma.FloatFieldRefInput<$PrismaModel>;
    in?: number[] | Prisma.ListFloatFieldRefInput<$PrismaModel>;
    notIn?: number[] | Prisma.ListFloatFieldRefInput<$PrismaModel>;
    lt?: number | Prisma.FloatFieldRefInput<$PrismaModel>;
    lte?: number | Prisma.FloatFieldRefInput<$PrismaModel>;
    gt?: number | Prisma.FloatFieldRefInput<$PrismaModel>;
    gte?: number | Prisma.FloatFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedFloatFilter<$PrismaModel> | number;
};
export type NestedDateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | Prisma.DateTimeFieldRefInput<$PrismaModel>;
    in?: Date[] | string[] | Prisma.ListDateTimeFieldRefInput<$PrismaModel>;
    notIn?: Date[] | string[] | Prisma.ListDateTimeFieldRefInput<$PrismaModel>;
    lt?: Date | string | Prisma.DateTimeFieldRefInput<$PrismaModel>;
    lte?: Date | string | Prisma.DateTimeFieldRefInput<$PrismaModel>;
    gt?: Date | string | Prisma.DateTimeFieldRefInput<$PrismaModel>;
    gte?: Date | string | Prisma.DateTimeFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _min?: Prisma.NestedDateTimeFilter<$PrismaModel>;
    _max?: Prisma.NestedDateTimeFilter<$PrismaModel>;
};
export type NestedEnumAuthProviderFilter<$PrismaModel = never> = {
    equals?: $Enums.AuthProvider | Prisma.EnumAuthProviderFieldRefInput<$PrismaModel>;
    in?: $Enums.AuthProvider[] | Prisma.ListEnumAuthProviderFieldRefInput<$PrismaModel>;
    notIn?: $Enums.AuthProvider[] | Prisma.ListEnumAuthProviderFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumAuthProviderFilter<$PrismaModel> | $Enums.AuthProvider;
};
export type NestedEnumAuthProviderWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.AuthProvider | Prisma.EnumAuthProviderFieldRefInput<$PrismaModel>;
    in?: $Enums.AuthProvider[] | Prisma.ListEnumAuthProviderFieldRefInput<$PrismaModel>;
    notIn?: $Enums.AuthProvider[] | Prisma.ListEnumAuthProviderFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumAuthProviderWithAggregatesFilter<$PrismaModel> | $Enums.AuthProvider;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _min?: Prisma.NestedEnumAuthProviderFilter<$PrismaModel>;
    _max?: Prisma.NestedEnumAuthProviderFilter<$PrismaModel>;
};
export type NestedEnumRoleScopeFilter<$PrismaModel = never> = {
    equals?: $Enums.RoleScope | Prisma.EnumRoleScopeFieldRefInput<$PrismaModel>;
    in?: $Enums.RoleScope[] | Prisma.ListEnumRoleScopeFieldRefInput<$PrismaModel>;
    notIn?: $Enums.RoleScope[] | Prisma.ListEnumRoleScopeFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumRoleScopeFilter<$PrismaModel> | $Enums.RoleScope;
};
export type NestedBoolFilter<$PrismaModel = never> = {
    equals?: boolean | Prisma.BooleanFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedBoolFilter<$PrismaModel> | boolean;
};
export type NestedEnumRoleScopeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.RoleScope | Prisma.EnumRoleScopeFieldRefInput<$PrismaModel>;
    in?: $Enums.RoleScope[] | Prisma.ListEnumRoleScopeFieldRefInput<$PrismaModel>;
    notIn?: $Enums.RoleScope[] | Prisma.ListEnumRoleScopeFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumRoleScopeWithAggregatesFilter<$PrismaModel> | $Enums.RoleScope;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _min?: Prisma.NestedEnumRoleScopeFilter<$PrismaModel>;
    _max?: Prisma.NestedEnumRoleScopeFilter<$PrismaModel>;
};
export type NestedBoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | Prisma.BooleanFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedBoolWithAggregatesFilter<$PrismaModel> | boolean;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _min?: Prisma.NestedBoolFilter<$PrismaModel>;
    _max?: Prisma.NestedBoolFilter<$PrismaModel>;
};
export type NestedEnumPermissionScopeFilter<$PrismaModel = never> = {
    equals?: $Enums.PermissionScope | Prisma.EnumPermissionScopeFieldRefInput<$PrismaModel>;
    in?: $Enums.PermissionScope[] | Prisma.ListEnumPermissionScopeFieldRefInput<$PrismaModel>;
    notIn?: $Enums.PermissionScope[] | Prisma.ListEnumPermissionScopeFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumPermissionScopeFilter<$PrismaModel> | $Enums.PermissionScope;
};
export type NestedEnumPermissionScopeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.PermissionScope | Prisma.EnumPermissionScopeFieldRefInput<$PrismaModel>;
    in?: $Enums.PermissionScope[] | Prisma.ListEnumPermissionScopeFieldRefInput<$PrismaModel>;
    notIn?: $Enums.PermissionScope[] | Prisma.ListEnumPermissionScopeFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumPermissionScopeWithAggregatesFilter<$PrismaModel> | $Enums.PermissionScope;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _min?: Prisma.NestedEnumPermissionScopeFilter<$PrismaModel>;
    _max?: Prisma.NestedEnumPermissionScopeFilter<$PrismaModel>;
};
export type NestedEnumOrganizationTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.OrganizationType | Prisma.EnumOrganizationTypeFieldRefInput<$PrismaModel>;
    in?: $Enums.OrganizationType[] | Prisma.ListEnumOrganizationTypeFieldRefInput<$PrismaModel>;
    notIn?: $Enums.OrganizationType[] | Prisma.ListEnumOrganizationTypeFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumOrganizationTypeFilter<$PrismaModel> | $Enums.OrganizationType;
};
export type NestedDecimalNullableFilter<$PrismaModel = never> = {
    equals?: runtime.Decimal | runtime.DecimalJsLike | number | string | Prisma.DecimalFieldRefInput<$PrismaModel> | null;
    in?: runtime.Decimal[] | runtime.DecimalJsLike[] | number[] | string[] | Prisma.ListDecimalFieldRefInput<$PrismaModel> | null;
    notIn?: runtime.Decimal[] | runtime.DecimalJsLike[] | number[] | string[] | Prisma.ListDecimalFieldRefInput<$PrismaModel> | null;
    lt?: runtime.Decimal | runtime.DecimalJsLike | number | string | Prisma.DecimalFieldRefInput<$PrismaModel>;
    lte?: runtime.Decimal | runtime.DecimalJsLike | number | string | Prisma.DecimalFieldRefInput<$PrismaModel>;
    gt?: runtime.Decimal | runtime.DecimalJsLike | number | string | Prisma.DecimalFieldRefInput<$PrismaModel>;
    gte?: runtime.Decimal | runtime.DecimalJsLike | number | string | Prisma.DecimalFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedDecimalNullableFilter<$PrismaModel> | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
};
export type NestedEnumVerificationStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.VerificationStatus | Prisma.EnumVerificationStatusFieldRefInput<$PrismaModel>;
    in?: $Enums.VerificationStatus[] | Prisma.ListEnumVerificationStatusFieldRefInput<$PrismaModel>;
    notIn?: $Enums.VerificationStatus[] | Prisma.ListEnumVerificationStatusFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumVerificationStatusFilter<$PrismaModel> | $Enums.VerificationStatus;
};
export type NestedEnumOrganizationStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.OrganizationStatus | Prisma.EnumOrganizationStatusFieldRefInput<$PrismaModel>;
    in?: $Enums.OrganizationStatus[] | Prisma.ListEnumOrganizationStatusFieldRefInput<$PrismaModel>;
    notIn?: $Enums.OrganizationStatus[] | Prisma.ListEnumOrganizationStatusFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumOrganizationStatusFilter<$PrismaModel> | $Enums.OrganizationStatus;
};
export type NestedEnumOrganizationTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.OrganizationType | Prisma.EnumOrganizationTypeFieldRefInput<$PrismaModel>;
    in?: $Enums.OrganizationType[] | Prisma.ListEnumOrganizationTypeFieldRefInput<$PrismaModel>;
    notIn?: $Enums.OrganizationType[] | Prisma.ListEnumOrganizationTypeFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumOrganizationTypeWithAggregatesFilter<$PrismaModel> | $Enums.OrganizationType;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _min?: Prisma.NestedEnumOrganizationTypeFilter<$PrismaModel>;
    _max?: Prisma.NestedEnumOrganizationTypeFilter<$PrismaModel>;
};
export type NestedDecimalNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: runtime.Decimal | runtime.DecimalJsLike | number | string | Prisma.DecimalFieldRefInput<$PrismaModel> | null;
    in?: runtime.Decimal[] | runtime.DecimalJsLike[] | number[] | string[] | Prisma.ListDecimalFieldRefInput<$PrismaModel> | null;
    notIn?: runtime.Decimal[] | runtime.DecimalJsLike[] | number[] | string[] | Prisma.ListDecimalFieldRefInput<$PrismaModel> | null;
    lt?: runtime.Decimal | runtime.DecimalJsLike | number | string | Prisma.DecimalFieldRefInput<$PrismaModel>;
    lte?: runtime.Decimal | runtime.DecimalJsLike | number | string | Prisma.DecimalFieldRefInput<$PrismaModel>;
    gt?: runtime.Decimal | runtime.DecimalJsLike | number | string | Prisma.DecimalFieldRefInput<$PrismaModel>;
    gte?: runtime.Decimal | runtime.DecimalJsLike | number | string | Prisma.DecimalFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedDecimalNullableWithAggregatesFilter<$PrismaModel> | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    _count?: Prisma.NestedIntNullableFilter<$PrismaModel>;
    _avg?: Prisma.NestedDecimalNullableFilter<$PrismaModel>;
    _sum?: Prisma.NestedDecimalNullableFilter<$PrismaModel>;
    _min?: Prisma.NestedDecimalNullableFilter<$PrismaModel>;
    _max?: Prisma.NestedDecimalNullableFilter<$PrismaModel>;
};
export type NestedIntNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | Prisma.IntFieldRefInput<$PrismaModel> | null;
    in?: number[] | Prisma.ListIntFieldRefInput<$PrismaModel> | null;
    notIn?: number[] | Prisma.ListIntFieldRefInput<$PrismaModel> | null;
    lt?: number | Prisma.IntFieldRefInput<$PrismaModel>;
    lte?: number | Prisma.IntFieldRefInput<$PrismaModel>;
    gt?: number | Prisma.IntFieldRefInput<$PrismaModel>;
    gte?: number | Prisma.IntFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedIntNullableWithAggregatesFilter<$PrismaModel> | number | null;
    _count?: Prisma.NestedIntNullableFilter<$PrismaModel>;
    _avg?: Prisma.NestedFloatNullableFilter<$PrismaModel>;
    _sum?: Prisma.NestedIntNullableFilter<$PrismaModel>;
    _min?: Prisma.NestedIntNullableFilter<$PrismaModel>;
    _max?: Prisma.NestedIntNullableFilter<$PrismaModel>;
};
export type NestedFloatNullableFilter<$PrismaModel = never> = {
    equals?: number | Prisma.FloatFieldRefInput<$PrismaModel> | null;
    in?: number[] | Prisma.ListFloatFieldRefInput<$PrismaModel> | null;
    notIn?: number[] | Prisma.ListFloatFieldRefInput<$PrismaModel> | null;
    lt?: number | Prisma.FloatFieldRefInput<$PrismaModel>;
    lte?: number | Prisma.FloatFieldRefInput<$PrismaModel>;
    gt?: number | Prisma.FloatFieldRefInput<$PrismaModel>;
    gte?: number | Prisma.FloatFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedFloatNullableFilter<$PrismaModel> | number | null;
};
export type NestedEnumVerificationStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.VerificationStatus | Prisma.EnumVerificationStatusFieldRefInput<$PrismaModel>;
    in?: $Enums.VerificationStatus[] | Prisma.ListEnumVerificationStatusFieldRefInput<$PrismaModel>;
    notIn?: $Enums.VerificationStatus[] | Prisma.ListEnumVerificationStatusFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumVerificationStatusWithAggregatesFilter<$PrismaModel> | $Enums.VerificationStatus;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _min?: Prisma.NestedEnumVerificationStatusFilter<$PrismaModel>;
    _max?: Prisma.NestedEnumVerificationStatusFilter<$PrismaModel>;
};
export type NestedEnumOrganizationStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.OrganizationStatus | Prisma.EnumOrganizationStatusFieldRefInput<$PrismaModel>;
    in?: $Enums.OrganizationStatus[] | Prisma.ListEnumOrganizationStatusFieldRefInput<$PrismaModel>;
    notIn?: $Enums.OrganizationStatus[] | Prisma.ListEnumOrganizationStatusFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumOrganizationStatusWithAggregatesFilter<$PrismaModel> | $Enums.OrganizationStatus;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _min?: Prisma.NestedEnumOrganizationStatusFilter<$PrismaModel>;
    _max?: Prisma.NestedEnumOrganizationStatusFilter<$PrismaModel>;
};
export type NestedEnumMembershipStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.MembershipStatus | Prisma.EnumMembershipStatusFieldRefInput<$PrismaModel>;
    in?: $Enums.MembershipStatus[] | Prisma.ListEnumMembershipStatusFieldRefInput<$PrismaModel>;
    notIn?: $Enums.MembershipStatus[] | Prisma.ListEnumMembershipStatusFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumMembershipStatusFilter<$PrismaModel> | $Enums.MembershipStatus;
};
export type NestedEnumMembershipStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.MembershipStatus | Prisma.EnumMembershipStatusFieldRefInput<$PrismaModel>;
    in?: $Enums.MembershipStatus[] | Prisma.ListEnumMembershipStatusFieldRefInput<$PrismaModel>;
    notIn?: $Enums.MembershipStatus[] | Prisma.ListEnumMembershipStatusFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumMembershipStatusWithAggregatesFilter<$PrismaModel> | $Enums.MembershipStatus;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _min?: Prisma.NestedEnumMembershipStatusFilter<$PrismaModel>;
    _max?: Prisma.NestedEnumMembershipStatusFilter<$PrismaModel>;
};
export type NestedEnumInvitationStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.InvitationStatus | Prisma.EnumInvitationStatusFieldRefInput<$PrismaModel>;
    in?: $Enums.InvitationStatus[] | Prisma.ListEnumInvitationStatusFieldRefInput<$PrismaModel>;
    notIn?: $Enums.InvitationStatus[] | Prisma.ListEnumInvitationStatusFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumInvitationStatusFilter<$PrismaModel> | $Enums.InvitationStatus;
};
export type NestedEnumInvitationStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.InvitationStatus | Prisma.EnumInvitationStatusFieldRefInput<$PrismaModel>;
    in?: $Enums.InvitationStatus[] | Prisma.ListEnumInvitationStatusFieldRefInput<$PrismaModel>;
    notIn?: $Enums.InvitationStatus[] | Prisma.ListEnumInvitationStatusFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumInvitationStatusWithAggregatesFilter<$PrismaModel> | $Enums.InvitationStatus;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _min?: Prisma.NestedEnumInvitationStatusFilter<$PrismaModel>;
    _max?: Prisma.NestedEnumInvitationStatusFilter<$PrismaModel>;
};
export type NestedEnumTransportTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.TransportType | Prisma.EnumTransportTypeFieldRefInput<$PrismaModel>;
    in?: $Enums.TransportType[] | Prisma.ListEnumTransportTypeFieldRefInput<$PrismaModel>;
    notIn?: $Enums.TransportType[] | Prisma.ListEnumTransportTypeFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumTransportTypeFilter<$PrismaModel> | $Enums.TransportType;
};
export type NestedEnumTransportTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.TransportType | Prisma.EnumTransportTypeFieldRefInput<$PrismaModel>;
    in?: $Enums.TransportType[] | Prisma.ListEnumTransportTypeFieldRefInput<$PrismaModel>;
    notIn?: $Enums.TransportType[] | Prisma.ListEnumTransportTypeFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumTransportTypeWithAggregatesFilter<$PrismaModel> | $Enums.TransportType;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _min?: Prisma.NestedEnumTransportTypeFilter<$PrismaModel>;
    _max?: Prisma.NestedEnumTransportTypeFilter<$PrismaModel>;
};
export type NestedEnumFoodCategoryFilter<$PrismaModel = never> = {
    equals?: $Enums.FoodCategory | Prisma.EnumFoodCategoryFieldRefInput<$PrismaModel>;
    in?: $Enums.FoodCategory[] | Prisma.ListEnumFoodCategoryFieldRefInput<$PrismaModel>;
    notIn?: $Enums.FoodCategory[] | Prisma.ListEnumFoodCategoryFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumFoodCategoryFilter<$PrismaModel> | $Enums.FoodCategory;
};
export type NestedEnumFoodTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.FoodType | Prisma.EnumFoodTypeFieldRefInput<$PrismaModel>;
    in?: $Enums.FoodType[] | Prisma.ListEnumFoodTypeFieldRefInput<$PrismaModel>;
    notIn?: $Enums.FoodType[] | Prisma.ListEnumFoodTypeFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumFoodTypeFilter<$PrismaModel> | $Enums.FoodType;
};
export type NestedDecimalFilter<$PrismaModel = never> = {
    equals?: runtime.Decimal | runtime.DecimalJsLike | number | string | Prisma.DecimalFieldRefInput<$PrismaModel>;
    in?: runtime.Decimal[] | runtime.DecimalJsLike[] | number[] | string[] | Prisma.ListDecimalFieldRefInput<$PrismaModel>;
    notIn?: runtime.Decimal[] | runtime.DecimalJsLike[] | number[] | string[] | Prisma.ListDecimalFieldRefInput<$PrismaModel>;
    lt?: runtime.Decimal | runtime.DecimalJsLike | number | string | Prisma.DecimalFieldRefInput<$PrismaModel>;
    lte?: runtime.Decimal | runtime.DecimalJsLike | number | string | Prisma.DecimalFieldRefInput<$PrismaModel>;
    gt?: runtime.Decimal | runtime.DecimalJsLike | number | string | Prisma.DecimalFieldRefInput<$PrismaModel>;
    gte?: runtime.Decimal | runtime.DecimalJsLike | number | string | Prisma.DecimalFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedDecimalFilter<$PrismaModel> | runtime.Decimal | runtime.DecimalJsLike | number | string;
};
export type NestedEnumFoodUnitFilter<$PrismaModel = never> = {
    equals?: $Enums.FoodUnit | Prisma.EnumFoodUnitFieldRefInput<$PrismaModel>;
    in?: $Enums.FoodUnit[] | Prisma.ListEnumFoodUnitFieldRefInput<$PrismaModel>;
    notIn?: $Enums.FoodUnit[] | Prisma.ListEnumFoodUnitFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumFoodUnitFilter<$PrismaModel> | $Enums.FoodUnit;
};
export type NestedEnumStorageTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.StorageType | Prisma.EnumStorageTypeFieldRefInput<$PrismaModel>;
    in?: $Enums.StorageType[] | Prisma.ListEnumStorageTypeFieldRefInput<$PrismaModel>;
    notIn?: $Enums.StorageType[] | Prisma.ListEnumStorageTypeFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumStorageTypeFilter<$PrismaModel> | $Enums.StorageType;
};
export type NestedEnumDonationStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.DonationStatus | Prisma.EnumDonationStatusFieldRefInput<$PrismaModel>;
    in?: $Enums.DonationStatus[] | Prisma.ListEnumDonationStatusFieldRefInput<$PrismaModel>;
    notIn?: $Enums.DonationStatus[] | Prisma.ListEnumDonationStatusFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumDonationStatusFilter<$PrismaModel> | $Enums.DonationStatus;
};
export type NestedEnumFoodCategoryWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.FoodCategory | Prisma.EnumFoodCategoryFieldRefInput<$PrismaModel>;
    in?: $Enums.FoodCategory[] | Prisma.ListEnumFoodCategoryFieldRefInput<$PrismaModel>;
    notIn?: $Enums.FoodCategory[] | Prisma.ListEnumFoodCategoryFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumFoodCategoryWithAggregatesFilter<$PrismaModel> | $Enums.FoodCategory;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _min?: Prisma.NestedEnumFoodCategoryFilter<$PrismaModel>;
    _max?: Prisma.NestedEnumFoodCategoryFilter<$PrismaModel>;
};
export type NestedEnumFoodTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.FoodType | Prisma.EnumFoodTypeFieldRefInput<$PrismaModel>;
    in?: $Enums.FoodType[] | Prisma.ListEnumFoodTypeFieldRefInput<$PrismaModel>;
    notIn?: $Enums.FoodType[] | Prisma.ListEnumFoodTypeFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumFoodTypeWithAggregatesFilter<$PrismaModel> | $Enums.FoodType;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _min?: Prisma.NestedEnumFoodTypeFilter<$PrismaModel>;
    _max?: Prisma.NestedEnumFoodTypeFilter<$PrismaModel>;
};
export type NestedDecimalWithAggregatesFilter<$PrismaModel = never> = {
    equals?: runtime.Decimal | runtime.DecimalJsLike | number | string | Prisma.DecimalFieldRefInput<$PrismaModel>;
    in?: runtime.Decimal[] | runtime.DecimalJsLike[] | number[] | string[] | Prisma.ListDecimalFieldRefInput<$PrismaModel>;
    notIn?: runtime.Decimal[] | runtime.DecimalJsLike[] | number[] | string[] | Prisma.ListDecimalFieldRefInput<$PrismaModel>;
    lt?: runtime.Decimal | runtime.DecimalJsLike | number | string | Prisma.DecimalFieldRefInput<$PrismaModel>;
    lte?: runtime.Decimal | runtime.DecimalJsLike | number | string | Prisma.DecimalFieldRefInput<$PrismaModel>;
    gt?: runtime.Decimal | runtime.DecimalJsLike | number | string | Prisma.DecimalFieldRefInput<$PrismaModel>;
    gte?: runtime.Decimal | runtime.DecimalJsLike | number | string | Prisma.DecimalFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedDecimalWithAggregatesFilter<$PrismaModel> | runtime.Decimal | runtime.DecimalJsLike | number | string;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _avg?: Prisma.NestedDecimalFilter<$PrismaModel>;
    _sum?: Prisma.NestedDecimalFilter<$PrismaModel>;
    _min?: Prisma.NestedDecimalFilter<$PrismaModel>;
    _max?: Prisma.NestedDecimalFilter<$PrismaModel>;
};
export type NestedEnumFoodUnitWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.FoodUnit | Prisma.EnumFoodUnitFieldRefInput<$PrismaModel>;
    in?: $Enums.FoodUnit[] | Prisma.ListEnumFoodUnitFieldRefInput<$PrismaModel>;
    notIn?: $Enums.FoodUnit[] | Prisma.ListEnumFoodUnitFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumFoodUnitWithAggregatesFilter<$PrismaModel> | $Enums.FoodUnit;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _min?: Prisma.NestedEnumFoodUnitFilter<$PrismaModel>;
    _max?: Prisma.NestedEnumFoodUnitFilter<$PrismaModel>;
};
export type NestedEnumStorageTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.StorageType | Prisma.EnumStorageTypeFieldRefInput<$PrismaModel>;
    in?: $Enums.StorageType[] | Prisma.ListEnumStorageTypeFieldRefInput<$PrismaModel>;
    notIn?: $Enums.StorageType[] | Prisma.ListEnumStorageTypeFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumStorageTypeWithAggregatesFilter<$PrismaModel> | $Enums.StorageType;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _min?: Prisma.NestedEnumStorageTypeFilter<$PrismaModel>;
    _max?: Prisma.NestedEnumStorageTypeFilter<$PrismaModel>;
};
export type NestedEnumDonationStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.DonationStatus | Prisma.EnumDonationStatusFieldRefInput<$PrismaModel>;
    in?: $Enums.DonationStatus[] | Prisma.ListEnumDonationStatusFieldRefInput<$PrismaModel>;
    notIn?: $Enums.DonationStatus[] | Prisma.ListEnumDonationStatusFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumDonationStatusWithAggregatesFilter<$PrismaModel> | $Enums.DonationStatus;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _min?: Prisma.NestedEnumDonationStatusFilter<$PrismaModel>;
    _max?: Prisma.NestedEnumDonationStatusFilter<$PrismaModel>;
};
export type NestedEnumSafetyCheckResultFilter<$PrismaModel = never> = {
    equals?: $Enums.SafetyCheckResult | Prisma.EnumSafetyCheckResultFieldRefInput<$PrismaModel>;
    in?: $Enums.SafetyCheckResult[] | Prisma.ListEnumSafetyCheckResultFieldRefInput<$PrismaModel>;
    notIn?: $Enums.SafetyCheckResult[] | Prisma.ListEnumSafetyCheckResultFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumSafetyCheckResultFilter<$PrismaModel> | $Enums.SafetyCheckResult;
};
export type NestedEnumSafetyCheckResultWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.SafetyCheckResult | Prisma.EnumSafetyCheckResultFieldRefInput<$PrismaModel>;
    in?: $Enums.SafetyCheckResult[] | Prisma.ListEnumSafetyCheckResultFieldRefInput<$PrismaModel>;
    notIn?: $Enums.SafetyCheckResult[] | Prisma.ListEnumSafetyCheckResultFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumSafetyCheckResultWithAggregatesFilter<$PrismaModel> | $Enums.SafetyCheckResult;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _min?: Prisma.NestedEnumSafetyCheckResultFilter<$PrismaModel>;
    _max?: Prisma.NestedEnumSafetyCheckResultFilter<$PrismaModel>;
};
export type NestedEnumPickupModeFilter<$PrismaModel = never> = {
    equals?: $Enums.PickupMode | Prisma.EnumPickupModeFieldRefInput<$PrismaModel>;
    in?: $Enums.PickupMode[] | Prisma.ListEnumPickupModeFieldRefInput<$PrismaModel>;
    notIn?: $Enums.PickupMode[] | Prisma.ListEnumPickupModeFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumPickupModeFilter<$PrismaModel> | $Enums.PickupMode;
};
export type NestedEnumClaimStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.ClaimStatus | Prisma.EnumClaimStatusFieldRefInput<$PrismaModel>;
    in?: $Enums.ClaimStatus[] | Prisma.ListEnumClaimStatusFieldRefInput<$PrismaModel>;
    notIn?: $Enums.ClaimStatus[] | Prisma.ListEnumClaimStatusFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumClaimStatusFilter<$PrismaModel> | $Enums.ClaimStatus;
};
export type NestedEnumPickupModeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.PickupMode | Prisma.EnumPickupModeFieldRefInput<$PrismaModel>;
    in?: $Enums.PickupMode[] | Prisma.ListEnumPickupModeFieldRefInput<$PrismaModel>;
    notIn?: $Enums.PickupMode[] | Prisma.ListEnumPickupModeFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumPickupModeWithAggregatesFilter<$PrismaModel> | $Enums.PickupMode;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _min?: Prisma.NestedEnumPickupModeFilter<$PrismaModel>;
    _max?: Prisma.NestedEnumPickupModeFilter<$PrismaModel>;
};
export type NestedEnumClaimStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.ClaimStatus | Prisma.EnumClaimStatusFieldRefInput<$PrismaModel>;
    in?: $Enums.ClaimStatus[] | Prisma.ListEnumClaimStatusFieldRefInput<$PrismaModel>;
    notIn?: $Enums.ClaimStatus[] | Prisma.ListEnumClaimStatusFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumClaimStatusWithAggregatesFilter<$PrismaModel> | $Enums.ClaimStatus;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _min?: Prisma.NestedEnumClaimStatusFilter<$PrismaModel>;
    _max?: Prisma.NestedEnumClaimStatusFilter<$PrismaModel>;
};
export type NestedEnumRequestPriorityFilter<$PrismaModel = never> = {
    equals?: $Enums.RequestPriority | Prisma.EnumRequestPriorityFieldRefInput<$PrismaModel>;
    in?: $Enums.RequestPriority[] | Prisma.ListEnumRequestPriorityFieldRefInput<$PrismaModel>;
    notIn?: $Enums.RequestPriority[] | Prisma.ListEnumRequestPriorityFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumRequestPriorityFilter<$PrismaModel> | $Enums.RequestPriority;
};
export type NestedEnumFoodRequestStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.FoodRequestStatus | Prisma.EnumFoodRequestStatusFieldRefInput<$PrismaModel>;
    in?: $Enums.FoodRequestStatus[] | Prisma.ListEnumFoodRequestStatusFieldRefInput<$PrismaModel>;
    notIn?: $Enums.FoodRequestStatus[] | Prisma.ListEnumFoodRequestStatusFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumFoodRequestStatusFilter<$PrismaModel> | $Enums.FoodRequestStatus;
};
export type NestedEnumRequestPriorityWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.RequestPriority | Prisma.EnumRequestPriorityFieldRefInput<$PrismaModel>;
    in?: $Enums.RequestPriority[] | Prisma.ListEnumRequestPriorityFieldRefInput<$PrismaModel>;
    notIn?: $Enums.RequestPriority[] | Prisma.ListEnumRequestPriorityFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumRequestPriorityWithAggregatesFilter<$PrismaModel> | $Enums.RequestPriority;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _min?: Prisma.NestedEnumRequestPriorityFilter<$PrismaModel>;
    _max?: Prisma.NestedEnumRequestPriorityFilter<$PrismaModel>;
};
export type NestedEnumFoodRequestStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.FoodRequestStatus | Prisma.EnumFoodRequestStatusFieldRefInput<$PrismaModel>;
    in?: $Enums.FoodRequestStatus[] | Prisma.ListEnumFoodRequestStatusFieldRefInput<$PrismaModel>;
    notIn?: $Enums.FoodRequestStatus[] | Prisma.ListEnumFoodRequestStatusFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumFoodRequestStatusWithAggregatesFilter<$PrismaModel> | $Enums.FoodRequestStatus;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _min?: Prisma.NestedEnumFoodRequestStatusFilter<$PrismaModel>;
    _max?: Prisma.NestedEnumFoodRequestStatusFilter<$PrismaModel>;
};
export type NestedEnumFulfillmentStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.FulfillmentStatus | Prisma.EnumFulfillmentStatusFieldRefInput<$PrismaModel>;
    in?: $Enums.FulfillmentStatus[] | Prisma.ListEnumFulfillmentStatusFieldRefInput<$PrismaModel>;
    notIn?: $Enums.FulfillmentStatus[] | Prisma.ListEnumFulfillmentStatusFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumFulfillmentStatusFilter<$PrismaModel> | $Enums.FulfillmentStatus;
};
export type NestedEnumFulfillmentStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.FulfillmentStatus | Prisma.EnumFulfillmentStatusFieldRefInput<$PrismaModel>;
    in?: $Enums.FulfillmentStatus[] | Prisma.ListEnumFulfillmentStatusFieldRefInput<$PrismaModel>;
    notIn?: $Enums.FulfillmentStatus[] | Prisma.ListEnumFulfillmentStatusFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumFulfillmentStatusWithAggregatesFilter<$PrismaModel> | $Enums.FulfillmentStatus;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _min?: Prisma.NestedEnumFulfillmentStatusFilter<$PrismaModel>;
    _max?: Prisma.NestedEnumFulfillmentStatusFilter<$PrismaModel>;
};
export type NestedEnumDeliveryStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.DeliveryStatus | Prisma.EnumDeliveryStatusFieldRefInput<$PrismaModel>;
    in?: $Enums.DeliveryStatus[] | Prisma.ListEnumDeliveryStatusFieldRefInput<$PrismaModel>;
    notIn?: $Enums.DeliveryStatus[] | Prisma.ListEnumDeliveryStatusFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumDeliveryStatusFilter<$PrismaModel> | $Enums.DeliveryStatus;
};
export type NestedEnumDeliveryStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.DeliveryStatus | Prisma.EnumDeliveryStatusFieldRefInput<$PrismaModel>;
    in?: $Enums.DeliveryStatus[] | Prisma.ListEnumDeliveryStatusFieldRefInput<$PrismaModel>;
    notIn?: $Enums.DeliveryStatus[] | Prisma.ListEnumDeliveryStatusFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumDeliveryStatusWithAggregatesFilter<$PrismaModel> | $Enums.DeliveryStatus;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _min?: Prisma.NestedEnumDeliveryStatusFilter<$PrismaModel>;
    _max?: Prisma.NestedEnumDeliveryStatusFilter<$PrismaModel>;
};
export type NestedEnumReviewTargetTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.ReviewTargetType | Prisma.EnumReviewTargetTypeFieldRefInput<$PrismaModel>;
    in?: $Enums.ReviewTargetType[] | Prisma.ListEnumReviewTargetTypeFieldRefInput<$PrismaModel>;
    notIn?: $Enums.ReviewTargetType[] | Prisma.ListEnumReviewTargetTypeFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumReviewTargetTypeFilter<$PrismaModel> | $Enums.ReviewTargetType;
};
export type NestedEnumReviewTargetTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.ReviewTargetType | Prisma.EnumReviewTargetTypeFieldRefInput<$PrismaModel>;
    in?: $Enums.ReviewTargetType[] | Prisma.ListEnumReviewTargetTypeFieldRefInput<$PrismaModel>;
    notIn?: $Enums.ReviewTargetType[] | Prisma.ListEnumReviewTargetTypeFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumReviewTargetTypeWithAggregatesFilter<$PrismaModel> | $Enums.ReviewTargetType;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _min?: Prisma.NestedEnumReviewTargetTypeFilter<$PrismaModel>;
    _max?: Prisma.NestedEnumReviewTargetTypeFilter<$PrismaModel>;
};
export type NestedJsonNullableFilter<$PrismaModel = never> = Prisma.PatchUndefined<Prisma.Either<Required<NestedJsonNullableFilterBase<$PrismaModel>>, Exclude<keyof Required<NestedJsonNullableFilterBase<$PrismaModel>>, 'path'>>, Required<NestedJsonNullableFilterBase<$PrismaModel>>> | Prisma.OptionalFlat<Omit<Required<NestedJsonNullableFilterBase<$PrismaModel>>, 'path'>>;
export type NestedJsonNullableFilterBase<$PrismaModel = never> = {
    equals?: runtime.InputJsonValue | Prisma.JsonFieldRefInput<$PrismaModel> | Prisma.JsonNullValueFilter;
    path?: string[];
    mode?: Prisma.QueryMode | Prisma.EnumQueryModeFieldRefInput<$PrismaModel>;
    string_contains?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    string_starts_with?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    string_ends_with?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    array_starts_with?: runtime.InputJsonValue | Prisma.JsonFieldRefInput<$PrismaModel> | null;
    array_ends_with?: runtime.InputJsonValue | Prisma.JsonFieldRefInput<$PrismaModel> | null;
    array_contains?: runtime.InputJsonValue | Prisma.JsonFieldRefInput<$PrismaModel> | null;
    lt?: runtime.InputJsonValue | Prisma.JsonFieldRefInput<$PrismaModel>;
    lte?: runtime.InputJsonValue | Prisma.JsonFieldRefInput<$PrismaModel>;
    gt?: runtime.InputJsonValue | Prisma.JsonFieldRefInput<$PrismaModel>;
    gte?: runtime.InputJsonValue | Prisma.JsonFieldRefInput<$PrismaModel>;
    not?: runtime.InputJsonValue | Prisma.JsonFieldRefInput<$PrismaModel> | Prisma.JsonNullValueFilter;
};
export type NestedEnumAdminRoleTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.AdminRoleType | Prisma.EnumAdminRoleTypeFieldRefInput<$PrismaModel>;
    in?: $Enums.AdminRoleType[] | Prisma.ListEnumAdminRoleTypeFieldRefInput<$PrismaModel>;
    notIn?: $Enums.AdminRoleType[] | Prisma.ListEnumAdminRoleTypeFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumAdminRoleTypeFilter<$PrismaModel> | $Enums.AdminRoleType;
};
export type NestedEnumAdminRoleTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.AdminRoleType | Prisma.EnumAdminRoleTypeFieldRefInput<$PrismaModel>;
    in?: $Enums.AdminRoleType[] | Prisma.ListEnumAdminRoleTypeFieldRefInput<$PrismaModel>;
    notIn?: $Enums.AdminRoleType[] | Prisma.ListEnumAdminRoleTypeFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumAdminRoleTypeWithAggregatesFilter<$PrismaModel> | $Enums.AdminRoleType;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _min?: Prisma.NestedEnumAdminRoleTypeFilter<$PrismaModel>;
    _max?: Prisma.NestedEnumAdminRoleTypeFilter<$PrismaModel>;
};
export type NestedEnumDevicePlatformFilter<$PrismaModel = never> = {
    equals?: $Enums.DevicePlatform | Prisma.EnumDevicePlatformFieldRefInput<$PrismaModel>;
    in?: $Enums.DevicePlatform[] | Prisma.ListEnumDevicePlatformFieldRefInput<$PrismaModel>;
    notIn?: $Enums.DevicePlatform[] | Prisma.ListEnumDevicePlatformFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumDevicePlatformFilter<$PrismaModel> | $Enums.DevicePlatform;
};
export type NestedEnumDevicePlatformWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.DevicePlatform | Prisma.EnumDevicePlatformFieldRefInput<$PrismaModel>;
    in?: $Enums.DevicePlatform[] | Prisma.ListEnumDevicePlatformFieldRefInput<$PrismaModel>;
    notIn?: $Enums.DevicePlatform[] | Prisma.ListEnumDevicePlatformFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumDevicePlatformWithAggregatesFilter<$PrismaModel> | $Enums.DevicePlatform;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _min?: Prisma.NestedEnumDevicePlatformFilter<$PrismaModel>;
    _max?: Prisma.NestedEnumDevicePlatformFilter<$PrismaModel>;
};
export type NestedJsonFilter<$PrismaModel = never> = Prisma.PatchUndefined<Prisma.Either<Required<NestedJsonFilterBase<$PrismaModel>>, Exclude<keyof Required<NestedJsonFilterBase<$PrismaModel>>, 'path'>>, Required<NestedJsonFilterBase<$PrismaModel>>> | Prisma.OptionalFlat<Omit<Required<NestedJsonFilterBase<$PrismaModel>>, 'path'>>;
export type NestedJsonFilterBase<$PrismaModel = never> = {
    equals?: runtime.InputJsonValue | Prisma.JsonFieldRefInput<$PrismaModel> | Prisma.JsonNullValueFilter;
    path?: string[];
    mode?: Prisma.QueryMode | Prisma.EnumQueryModeFieldRefInput<$PrismaModel>;
    string_contains?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    string_starts_with?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    string_ends_with?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    array_starts_with?: runtime.InputJsonValue | Prisma.JsonFieldRefInput<$PrismaModel> | null;
    array_ends_with?: runtime.InputJsonValue | Prisma.JsonFieldRefInput<$PrismaModel> | null;
    array_contains?: runtime.InputJsonValue | Prisma.JsonFieldRefInput<$PrismaModel> | null;
    lt?: runtime.InputJsonValue | Prisma.JsonFieldRefInput<$PrismaModel>;
    lte?: runtime.InputJsonValue | Prisma.JsonFieldRefInput<$PrismaModel>;
    gt?: runtime.InputJsonValue | Prisma.JsonFieldRefInput<$PrismaModel>;
    gte?: runtime.InputJsonValue | Prisma.JsonFieldRefInput<$PrismaModel>;
    not?: runtime.InputJsonValue | Prisma.JsonFieldRefInput<$PrismaModel> | Prisma.JsonNullValueFilter;
};
