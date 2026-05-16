import { HttpError } from "./httpError";

export interface UpdateProfileInput {
  firstName?: string;
  lastName?: string;
  bio?: string | null;
  avatarUrl?: string | null;
}

export interface SkillInput {
  skillId?: string;
  name?: string;
  description?: string | null;
  category?: string | null;
  yearsOfExperience?: number | null;
}

export interface LearningGoalInput {
  skillId?: string;
  name?: string;
  description?: string | null;
  targetLevel?: string | null;
}

const MAX_SHORT_TEXT_LENGTH = 120;
const MAX_LONG_TEXT_LENGTH = 1000;

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const optionalTrimmedString = (
  value: unknown,
  fieldName: string,
  maxLength = MAX_SHORT_TEXT_LENGTH
): string | null | undefined => {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  if (typeof value !== "string") {
    throw new HttpError(400, `${fieldName} must be a string`);
  }

  const trimmed = value.trim();

  if (trimmed.length === 0) {
    return null;
  }

  if (trimmed.length > maxLength) {
    throw new HttpError(400, `${fieldName} must be ${maxLength} characters or fewer`);
  }

  return trimmed;
};

const requiredSkillReference = (input: { skillId?: string; name?: string }): void => {
  if (!input.skillId && !input.name) {
    throw new HttpError(400, "skillId or name is required");
  }
};

export const parseUpdateProfileInput = (body: unknown): UpdateProfileInput => {
  if (!isObject(body)) {
    throw new HttpError(400, "Request body must be an object");
  }

  const firstName = optionalTrimmedString(body.firstName, "firstName");
  const lastName = optionalTrimmedString(body.lastName, "lastName");

  if (firstName === null || lastName === null) {
    throw new HttpError(400, "firstName and lastName cannot be empty");
  }

  const input: UpdateProfileInput = {
    firstName,
    lastName,
    bio: optionalTrimmedString(body.bio, "bio", MAX_LONG_TEXT_LENGTH),
    avatarUrl: optionalTrimmedString(body.avatarUrl, "avatarUrl", 2048)
  };

  if (Object.values(input).every((value) => value === undefined)) {
    throw new HttpError(400, "At least one profile field is required");
  }

  return input;
};

export const parseAvatarInput = (body: unknown): { avatarUrl: string | null } => {
  if (!isObject(body)) {
    throw new HttpError(400, "Request body must be an object");
  }

  const avatarUrl = optionalTrimmedString(body.avatarUrl, "avatarUrl", 2048);

  if (avatarUrl === undefined) {
    throw new HttpError(400, "avatarUrl is required");
  }

  return { avatarUrl };
};

export const parseSkillInput = (body: unknown): SkillInput => {
  if (!isObject(body)) {
    throw new HttpError(400, "Request body must be an object");
  }

  const yearsOfExperience = body.yearsOfExperience;

  if (
    yearsOfExperience !== undefined &&
    yearsOfExperience !== null &&
    (typeof yearsOfExperience !== "number" ||
      !Number.isInteger(yearsOfExperience) ||
      yearsOfExperience < 0)
  ) {
    throw new HttpError(400, "yearsOfExperience must be a non-negative integer");
  }

  const input: SkillInput = {
    skillId: optionalTrimmedString(body.skillId, "skillId") ?? undefined,
    name: optionalTrimmedString(body.name, "name") ?? undefined,
    description: optionalTrimmedString(body.description, "description", MAX_LONG_TEXT_LENGTH),
    category: optionalTrimmedString(body.category, "category"),
    yearsOfExperience:
      yearsOfExperience === undefined ? undefined : (yearsOfExperience as number | null)
  };

  requiredSkillReference(input);

  return input;
};

export const parseLearningGoalInput = (body: unknown): LearningGoalInput => {
  if (!isObject(body)) {
    throw new HttpError(400, "Request body must be an object");
  }

  const input: LearningGoalInput = {
    skillId: optionalTrimmedString(body.skillId, "skillId") ?? undefined,
    name: optionalTrimmedString(body.name, "name") ?? undefined,
    description: optionalTrimmedString(body.description, "description", MAX_LONG_TEXT_LENGTH),
    targetLevel: optionalTrimmedString(body.targetLevel, "targetLevel")
  };

  requiredSkillReference(input);

  return input;
};
