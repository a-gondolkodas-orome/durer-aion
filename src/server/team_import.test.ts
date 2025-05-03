import { TeamsRepository } from './db';
import { import_teams_from_tsv } from './team_import';
import { readFileSync } from 'fs';

jest.mock('fs');
jest.mock('./db');

describe('import_teams_from_tsv', () => {
  let mockDb: any;
  let mockTeamsRepo: TeamsRepository;

  beforeEach(() => {
    jest.resetAllMocks();

    mockDb = {
      sequelize: {
        sync: jest.fn(),
      },
    };

    mockTeamsRepo = new TeamsRepository(mockDb);
  });

  it('should handle a proper header with valid data correctly', async () => {
    const fileContent = `
    Teamname\tCategory\tEmail\tOther\tID\tLogin Code\tCredentials
    Test Team\tC\ttest@example.com\tSome Info\t\t\t
    `;
    (readFileSync as jest.Mock).mockReturnValue(fileContent.trim());

    const result = await import_teams_from_tsv(mockTeamsRepo, 'dummy_file.tsv');

    expect(mockTeamsRepo.insertTeam).toHaveBeenCalledTimes(1);
    expect(result.successful).toBe(1);
    expect(result.failed).toBe(0);
  });

  it('should log a warning if header does not match expected header', async () => {
    const fileContent = `
    Teamname\tCategory\tOther\tEmail\tID\tLogin Code\tCredentials
    Test Team\tC\ttest@example.com\tSome Info\t\t\t
    `;
    (readFileSync as jest.Mock).mockReturnValue(fileContent.trim());

    const result = await import_teams_from_tsv(mockTeamsRepo, 'dummy_file.tsv');

    expect(result.logs.value).toContain('WARNING: Header not exactly how we defined it. This is not always a problem.');
  });

  it('should fail if the category is invalid', async () => {
    const fileContent = `
    Teamname\tCategory\tEmail\tOther\tID\tLogin Code\tCredentials
    Test Team\tX\ttest@example.com\tSome Info\t\t\t
    `;
    (readFileSync as jest.Mock).mockReturnValue(fileContent.trim());

    const result = await import_teams_from_tsv(mockTeamsRepo, 'dummy_file.tsv');

    expect(result.failed).toBe(1);
    expect(result.successful).toBe(0);
    expect(mockTeamsRepo.insertTeam).not.toHaveBeenCalled();
  });

  it('should generate default teamId if missing', async () => {
    const fileContent = `
    Teamname\tCategory\tEmail\tOther\tID\tLogin Code\tCredentials
    Test Team\tC\ttest@example.com\tSome Info\t\t111-222-111\t67676767-6767-6767-6767-676767676768
    `;
    (readFileSync as jest.Mock).mockReturnValue(fileContent.trim());

    const result = await import_teams_from_tsv(mockTeamsRepo, 'dummy_file.tsv');

    expect(mockTeamsRepo.insertTeam).toHaveBeenCalledWith(
      expect.objectContaining({
        teamId: expect.any(String), // Expecting teamId to be a generated string
      }),
    );
    expect(result.successful).toBe(1);
  });

  it('should generate default login_code if missing', async () => {
    const fileContent = `
    Teamname\tCategory\tEmail\tOther\tID\tLogin Code\tCredentials
    Test Team\tC\ttest@example.com\tSome Info\tcustom-id\t\t67676767-6767-6767-6767-676767676768
    `;
    (readFileSync as jest.Mock).mockReturnValue(fileContent.trim());

    const result = await import_teams_from_tsv(mockTeamsRepo, 'dummy_file.tsv');

    expect(mockTeamsRepo.insertTeam).toHaveBeenCalledWith(
      expect.objectContaining({
        joinCode: expect.any(String), // Expecting joinCode to be a generated string
      }),
    );
    expect(result.successful).toBe(1);
  });

  it('should generate default credentials if missing', async () => {
    const fileContent = `
    Teamname\tCategory\tEmail\tOther\tID\tLogin Code\tCredentials
    Test Team\tC\ttest@example.com\tSome Info\tcustom-id\tABC-123-XYZ\t
    `;
    (readFileSync as jest.Mock).mockReturnValue(fileContent.trim());

    const result = await import_teams_from_tsv(mockTeamsRepo, 'dummy_file.tsv');

    expect(mockTeamsRepo.insertTeam).toHaveBeenCalledWith(
      expect.objectContaining({
        credentials: expect.any(String), // Expecting credentials to be a generated string
      }),
    );
    expect(result.successful).toBe(1);
  });

  it('should fail if credentials have an invalid format', async () => {
    const fileContent = `
    Teamname\tCategory\tEmail\tOther\tID\tLogin Code\tCredentials
    Test Team\tC\ttest@example.com\tSome Info\tcustom-id\tABC-123-XYZ\tinvalid-credentials
    `;
    (readFileSync as jest.Mock).mockReturnValue(fileContent.trim());

    const result = await import_teams_from_tsv(mockTeamsRepo, 'dummy_file.tsv');

    expect(result.failed).toBe(1);
    expect(result.successful).toBe(0);
    expect(result.logs.value).toContain('Credential is not a GUID for team Test Team');
    expect(mockTeamsRepo.insertTeam).not.toHaveBeenCalled();
  });
});
