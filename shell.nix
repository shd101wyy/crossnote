{ pkgs ? import <nixpkgs> { } }:
let
  # The rolling <nixpkgs> channel no longer packages Node 18 (EOL upstream),
  # so pull it from the last release line that still does. Node 18 is the
  # runtime of the VS Code extension host we must stay loadable on (no global
  # File, etc.). Keep .tool-versions (used by CI) on the same major version.
  node18 = import
    (builtins.fetchTarball {
      url = "https://github.com/NixOS/nixpkgs/archive/nixos-24.11.tar.gz";
      sha256 = "1s2gr5rcyqvpr58vxdcb095mdhblij9bfzaximrva2243aal3dgx";
    })
    {
      # pure-eval (nix develop) has no builtins.currentSystem
      system = builtins.currentSystem or "x86_64-linux";
    };
in
with pkgs;
mkShell {
  buildInputs = [ node18.nodejs_18 pnpm bash ];
  shellHook = ''
    # ...
  '';
}
