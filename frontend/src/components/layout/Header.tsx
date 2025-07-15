import { useAuth } from '../../context/AuthContext';


export default function Header() {
  const { user, logout } = useAuth();

  return (
        <header className="fixed inset-x-0 top-0 z-10 border-b border-gray-950/5 dark:border-white/10">

            <div className="bg-white dark:bg-gray-950">
              <div className="flex h-14 items-center justify-between gap-8 px-4 sm:px-6">
                <div className="flex items-center gap-4">
                  <a className="shrink-0" aria-label="Home" href="/">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="White" viewBox="0 0 24 24" stroke="currentColor" className="size-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 6.878V6a2.25 2.25 0 0 1 2.25-2.25h7.5A2.25 2.25 0 0 1 18 6v.878m-12 0c.235-.083.487-.128.75-.128h10.5c.263 0 .515.045.75.128m-12 0A2.25 2.25 0 0 0 4.5 9v.878m13.5-3A2.25 2.25 0 0 1 19.5 9v.878m0 0a2.246 2.246 0 0 0-.75-.128H5.25c-.263 0-.515.045-.75.128m15 0A2.25 2.25 0 0 1 21 12v6a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 18v-6c0-.98.626-1.813 1.5-2.122" />
                    </svg>
                  </a>
                  <a className="text-lg font-medium text-gray-950 dark:text-white">echo-tasks</a>
                  <div
                    className="flex items-center gap-0.5 rounded-2xl bg-gray-950/5 py-0.5 pr-2.5 pl-2.5 text-xs/5 font-medium text-gray-950 tabular-nums hover:bg-gray-950/7.5 data-active:bg-gray-950/7.5 dark:bg-white/10 dark:text-white dark:hover:bg-white/12.5 dark:data-active:bg-white/12.5"
                  >
                    v0.9.0
                  </div>
                  <a
                    aria-label="GitHub repository"
                    href="https://github.com/nokocu/echo-tasks"
                  >
                    <svg
                      viewBox="0 0 20 20"
                      className="size-5 fill-black/40 dark:fill-gray-400"
                    >
                      <path d="M10 0C4.475 0 0 4.475 0 10a9.994 9.994 0 006.838 9.488c.5.087.687-.213.687-.476 0-.237-.013-1.024-.013-1.862-2.512.463-3.162-.612-3.362-1.175-.113-.287-.6-1.175-1.025-1.412-.35-.188-.85-.65-.013-.663.788-.013 1.35.725 1.538 1.025.9 1.512 2.337 1.087 2.912.825.088-.65.35-1.088.638-1.338-2.225-.25-4.55-1.112-4.55-4.937 0-1.088.387-1.987 1.025-2.688-.1-.25-.45-1.274.1-2.65 0 0 .837-.262 2.75 1.026a9.28 9.28 0 012.5-.338c.85 0 1.7.112 2.5.337 1.912-1.3 2.75-1.024 2.75-1.024.55 1.375.2 2.4.1 2.65.637.7 1.025 1.587 1.025 2.687 0 3.838-2.337 4.688-4.562 4.938.362.312.675.912.675 1.85 0 1.337-.013 2.412-.013 2.75 0 .262.188.574.688.474A10.016 10.016 0 0020 10c0-5.525-4.475-10-10-10z"></path>
                    </svg>
                  </a>
                </div>
                <div className="flex items-center gap-6 max-md:hidden">
                  <span 
                    className="flex items-center gap-0.5 rounded-2xl bg-gray-950/5 py-0.5 pr-2.5 pl-2.5 text-xs/5 font-medium text-gray-950 tabular-nums hover:bg-gray-950/7.5 data-active:bg-gray-950/7.5 dark:bg-white/10 dark:text-white dark:hover:bg-white/12.5 dark:data-active:bg-white/12.5"

                  >
                    {user?.email}
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5 ">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    </svg>
                  </span>

                  <button className="text-sm/6 text-gray-950 dark:text-white" onClick={logout}>
                    Logout
                  </button>
                </div>
              </div>
            </div>
        </header>
  );
}
