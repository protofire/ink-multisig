# Use Rust 1.69
FROM rust:1.69

# Update Rust and install cargo contract
RUN rustup toolchain install nightly-2023-02-07 \
    && rustup default nightly-2023-02-07 \
    && rustup component add rust-src \
    && cargo install --force --version 3.0.1 cargo-contract

# Set working directory
WORKDIR /contracts
