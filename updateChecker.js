const parseVersion = (version) => {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(version ?? '');
  if (!match) throw new Error(`Invalid app version: ${version}`);
  return match.slice(1).map(Number);
};

const isOlderVersion = (current, latest) => {
  const currentParts = parseVersion(current);
  const latestParts = parseVersion(latest);
  for (let index = 0; index < currentParts.length; index += 1) {
    if (currentParts[index] !== latestParts[index]) {
      return currentParts[index] < latestParts[index];
    }
  }
  return false;
};

export const checkForRequiredUpdate = async (currentVersion, manifestUrl) => {
  if (!manifestUrl) throw new Error('Update manifest URL is not configured.');

  const manifestRequestUrl = new URL(manifestUrl);
  manifestRequestUrl.searchParams.set('_', String(Date.now()));
  const response = await fetch(manifestRequestUrl.toString(), {
    headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' },
  });
  if (!response.ok) throw new Error(`Update check failed with HTTP ${response.status}.`);

  const manifest = await response.json();
  if (typeof manifest.latestVersion !== 'string') {
    throw new Error('Update manifest is missing latestVersion.');
  }
  parseVersion(currentVersion);
  parseVersion(manifest.latestVersion);

  if (!isOlderVersion(currentVersion, manifest.latestVersion)) return null;

  let downloadUrl;
  try {
    downloadUrl = new URL(manifest.downloadUrl);
  } catch {
    throw new Error('Update manifest contains an invalid downloadUrl.');
  }
  if (downloadUrl.protocol !== 'https:' || downloadUrl.hostname !== 'github.com') {
    throw new Error('Update downloadUrl must be an HTTPS GitHub URL.');
  }

  return {
    latestVersion: manifest.latestVersion,
    downloadUrl: downloadUrl.toString(),
  };
};
