export default {
  //   solppcDownload: {
  //     darwin:

  //       "https://github.com/vitelabs/soliditypp-bin/releases/download/v0.4.2/solppc_darwin.tar.gz",
  //     linux:
  //       "https://github.com/vitelabs/soliditypp-bin/releases/download/v0.4.2/solppc_linux.tar.gz",
  //     win64:
  //       "https://github.com/vitelabs/soliditypp-bin/releases/download/v0.4.2/solppc_win.tar.gz"
  //   },
  createSolppcDownload(version: string, platform: string) {
    return `https://github.com/vitelabs/soliditypp-bin/releases/download/${version}/solppc_${platform}.tar.gz`;
  },
  createGviteDownload(version: string, platform: string) {
    return `https://github.com/vitelabs/go-vite/releases/download/${version}/gvite-${version}-${platform}.tar.gz`;
  }
};
