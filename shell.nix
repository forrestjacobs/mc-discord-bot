{ pkgs ? import <nixpkgs> {} }:

let
  pkgsUnstable = import <nixpkgs-unstable> {};

in pkgs.mkShell {
  buildInputs = [
    pkgsUnstable.nodejs-16_x
  ];
}
