# CertAInty Quantum

[CertAInty Quantum](https://supremacy.thomasbale.com/) is a suite of tools for quantum enhanced portfolio optimisation - made easy to understand and execute with informed AIs.

- We enhance [**Starkware's Brian AI**](tbc) (|Brian⟩) with our quantum pre execution scripts.
- Empower users with quantum financial tools powered by [**Wormhole API**](/code/frontend/quantum-portfolio-optimisation/app/analysis/page.tsx)
- Provide a **quantum informed XAI** assistant to demystify the quantum x (De)Fi world in an explainable manner
- We use solana to rebalance portfoliio's for low cost (gas fees)

## Video Walkthrough

[See our video here](https://drive.google.com/file/d/1rJswaWRV4ZFv3y5omEYdseYWrqywxxYq/view?usp=share_link)

## Reasoning

Quantum computing, through RNG and speed in algorithmic advantage is starting to play are large role in classical finance (with many major financial institutes - HSBC, Moody's etc) and DeFi. This is only bound to grow in the foreseeable future.

No only does CertAInty Quantum provide **a suite of quantum enchanced tools for portfolio optmisation**, it **leverages AI to enhance the execution** but more importantly, **our AI explains the implementation and use** behind these new tools.

## Main Features

### Quantum Enhanced Execution AI - |Brian⟩

We allow users to execute quantum enchanced trades, just by prompting

The workflow is as follows:
- call Brian's paraemter extracing api
- use this to call any quantum enhancement scripts selected
- call Brian's transaction api to get the trades
- launch a meta mask pop up to execute trade (not implemented)

these calls can be seen in [this script](https://github.com/TumCucTom/Quantum-AI-DeFi-Portfolio-Optimisation/blob/main/code/frontend/quantum-portfolio-optimisation/app/api/execute/route.ts)

### Quantum Enhanced Analysis Tools

#### Quantum TDA

quantum-enhanced topological data analysis pipeline by encoding high-dimensional data into a quantum feature space using a quantum kernel (with either ZZ or Pauli feature maps) and, in parallel, computing a classical RBF kernel, then converting these kernels into distance matrices. It applies persistent homology (via ripser) to these distance matrices to extract topological features, visualizing persistence diagrams and kernel heatmaps that reveal the underlying structure of the data.

You can use our AI to descibe this to you [here](https://certainty-quantum.thomasbale.com/snippet)

#### Quantum Monte Carlo

Monte carlo simulations, enhanced with quantum RNG and a quadratic speedup due to quantum annealing.

You can use our AI to descibe this to you [here](https://certainty-quantum.thomasbale.com/snippet)

#### Wormhole Live Data

We obtain live transaction and liquidity data which could be used to fuel the above or for the user's own research. You can do this [here](https://certainty-quantum.thomasbale.com/analysis)

### XAI / AI Assistant

Jesko is an explainable AI that helps users understand the quantum code and how these tools and features can help optimise their portfolio.

Jesko has two workflows which can be seen [here](https://github.com/TumCucTom/Quantum-AI-DeFi-Portfolio-Optimisation/blob/main/code/frontend/quantum-portfolio-optimisation/app/api/jesko-main/route.ts) and [here](https://github.com/TumCucTom/Quantum-AI-DeFi-Portfolio-Optimisation/blob/main/code/frontend/quantum-portfolio-optimisation/app/api/jesko-code/route.ts)

You can interact with him [here](https://certainty-quantum.thomasbale.com/snippet) and [here](https://certainty-quantum.thomasbale.com/assistant)

## License

Please see the [license](LICENSE)
