import AuthForms from "@/components/AuthForms";
import { demoLoginAction } from "@/lib/actions";

export const dynamic = "force-dynamic";

export const metadata = { title: "Sign in — Hot Off The Press" };

export default async function SignInPage(props: PageProps<"/sign-in">) {
  const { next } = await props.searchParams;
  const target = typeof next === "string" ? next : "/";

  return (
    <div className="max-w-6xl mx-auto px-4 py-14">
      <div className="grid gap-12 lg:grid-cols-2 max-w-4xl">
        <div>
          <h1 className="text-4xl mb-5">Sign in</h1>
          <p className="text-ink-soft leading-relaxed mb-8">
            Your account holds your numbers, your spins and every edition
            you&rsquo;ve entered. It takes a moment to make one.
          </p>

          {/* Demo entrances -------------------------------------------- */}
          <div className="card-flat p-5 bg-paper-deep">
            <p className="label mb-1">Prototype</p>
            <p className="text-sm text-ink-soft mb-4">
              Two accounts are seeded so the build can be walked through
              without setting anything up.
            </p>
            <div className="flex flex-wrap gap-3">
              <form action={demoLoginAction}>
                <input type="hidden" name="as" value="punter" />
                <button type="submit" className="btn btn-ink text-sm">
                  Enter as a punter
                </button>
              </form>
              <form action={demoLoginAction}>
                <input type="hidden" name="as" value="admin" />
                <button type="submit" className="btn btn-paper text-sm">
                  Enter as the operator
                </button>
              </form>
            </div>
            <p className="text-xs text-ink-faint mt-4 leading-snug">
              The punter holds 60 numbers in Edition Thirteen and has spins in
              hand. The operator can open and close sales and turn the drum.
            </p>
          </div>
        </div>

        <AuthForms next={target} />
      </div>
    </div>
  );
}
