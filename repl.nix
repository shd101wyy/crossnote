let flake = builtins.getFlake (toString ./.); in { inherit flake; }
