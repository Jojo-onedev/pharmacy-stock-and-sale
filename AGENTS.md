<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->
- App data (users, stock, sales, orders) lives in a local-storage store in src/lib/store.ts; why: single-terminal pharmacy POS with PIN login, no backend yet.
- Payment split/change rules live in src/lib/payment.ts with tests; why: money logic must stay tested.
