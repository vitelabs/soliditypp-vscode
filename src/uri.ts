export default {
  createSolppcDownload(version: string, platform: string) {
    return `https://github.com/vitelabs/soliditypp-bin/releases/download/${version}/solppc_${platform}.tar.gz`;
  },
  createGviteDownload(version: string, platform: string) {
    return `https://github.com/vitelabs/go-vite/releases/download/${version}/gvite-${version}-${platform}.tar.gz`;
  }
};
