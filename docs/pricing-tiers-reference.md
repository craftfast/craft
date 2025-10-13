# Tiered Pricing Quick Reference

## Pro Plan Pricing Table

| Credits | USD Price | INR Price | Use Case             |
| ------- | --------- | --------- | -------------------- |
| 100     | $25       | ₹2,075    | Light users, testing |
| 200     | $50       | ₹4,150    | Regular users        |
| 500     | $125      | ₹10,375   | Active developers    |
| 1,000   | $250      | ₹20,750   | Small teams          |
| 2,000   | $500      | ₹41,500   | Growing teams        |
| 5,000   | $1,250    | ₹103,750  | Large teams          |
| 10,000  | $2,500    | ₹207,500  | Power users          |

**Price per credit**: $0.25 USD or ₹20.75 INR

## Business Plan Pricing Table

| Credits | USD Price | INR Price | Use Case               |
| ------- | --------- | --------- | ---------------------- |
| 100     | $50       | ₹4,150    | Light business users   |
| 200     | $100      | ₹8,300    | Regular business users |
| 500     | $250      | ₹20,750   | Active businesses      |
| 1,000   | $500      | ₹41,500   | Small departments      |
| 2,000   | $1,000    | ₹83,000   | Growing departments    |
| 5,000   | $2,500    | ₹207,500  | Large departments      |
| 10,000  | $5,000    | ₹415,000  | Enterprise-level usage |

**Price per credit**: $0.50 USD or ₹41.50 INR

## Plan Comparison at Same Credit Levels

| Credits | Pro Plan (USD) | Business Plan (USD) | Difference     |
| ------- | -------------- | ------------------- | -------------- |
| 100     | $25            | $50                 | +$25 (100%)    |
| 500     | $125           | $250                | +$125 (100%)   |
| 1,000   | $250           | $500                | +$250 (100%)   |
| 5,000   | $1,250         | $2,500              | +$1,250 (100%) |
| 10,000  | $2,500         | $5,000              | +$2,500 (100%) |

**Business Plan costs exactly 2× Pro Plan** for the same number of credits, but includes:

- SSO authentication
- Opt-out of data training
- 4× more database storage (20GB vs 5GB)

## How to Calculate

### Pro Plan Formula

```
USD Price = Credits × $0.25
INR Price = Credits × ₹20.75
```

### Business Plan Formula

```
USD Price = Credits × $0.50
INR Price = Credits × ₹41.50
```

### Examples

**Pro Plan - 750 credits:**

- USD: 750 × $0.25 = $187.50
- INR: 750 × ₹20.75 = ₹15,562.50

**Business Plan - 3,500 credits:**

- USD: 3,500 × $0.50 = $1,750
- INR: 3,500 × ₹41.50 = ₹145,250

## Custom Credit Selection

Users can select any amount between **100 and 10,000 credits** in increments of 100:

- Minimum: 100 credits
- Maximum: 10,000 credits
- Increment: 100 credits
- Total options: 100 different tiers

## All Plans Overview

| Plan       | Min Credits | Max Credits | Base Price (USD) | Per Credit (USD) | Daily Limit |
| ---------- | ----------- | ----------- | ---------------- | ---------------- | ----------- |
| Free       | 20          | 20          | $0               | -                | 5/day       |
| Pro        | 100         | 10,000      | $25              | $0.25            | None        |
| Business   | 100         | 10,000      | $50              | $0.50            | None        |
| Enterprise | Custom      | Custom      | Contact Sales    | Custom           | None        |
