'use client'

import { useState, useEffect, useTransition } from "react"
import { saveDomain, getDomain, checkDomainStatus, deleteDomain, saveGoogleKeys, removeGoogleKeys, saveAppName } from "@/lib/actions/domain"

export default function WhiteLabel() {
  const [domain, setDomain] = useState("")
  const [savedRecord, setSavedRecord] = useState<{
    domain: string
    status: string
    googleClientId?: string | null
    googleClientSecret?: string | null
    appName?: string | null
  } | null>(null)

  const [error, setError] = useState("")
  const [isPending, startTransition] = useTransition()
  const [checking, setChecking] = useState(false)
  const [method, setMethod] = useState<"nameserver" | "cname">("nameserver")

  // Google keys state
  const [googleClientId, setGoogleClientId] = useState("")
  const [googleClientSecret, setGoogleClientSecret] = useState("")
  const [keysError, setKeysError] = useState("")
  const [keysPending, startKeysTransition] = useTransition()

  // App name state
  const [appName, setAppName] = useState("")
  const [appNameError, setAppNameError] = useState("")
  const [appNamePending, startAppNameTransition] = useTransition()

  useEffect(() => {
    getDomain().then((record) => {
      if (record) {
        setSavedRecord(record)
        setDomain(record.domain)
        if (record.appName) setAppName(record.appName)
      }
    })
  }, [])

  function handleSave() {
    setError("")
    startTransition(async () => {
      const res = await saveDomain(domain)
      if (res?.error) {
        setError(res.error)
      } else {
        const updated = await getDomain()
        setSavedRecord(updated)
      }
    })
  }

  async function handleCheck() {
    setChecking(true)
    const res = await checkDomainStatus()
    if (res?.error) {
      setError(res.error)
    } else {
      const updated = await getDomain()
      setSavedRecord(updated)
    }
    setChecking(false)
  }

  function handleDelete() {
    startTransition(async () => {
      const res = await deleteDomain()
      if (res?.error) {
        setError(res.error)
      } else {
        setSavedRecord(null)
        setDomain("")
      }
    })
  }

  function handleSaveKeys() {
    setKeysError("")
    if (!googleClientId || !googleClientSecret) {
      setKeysError("Both Client ID and Client Secret are required")
      return
    }
    startKeysTransition(async () => {
      const res = await saveGoogleKeys(googleClientId, googleClientSecret)
      if (res?.error) {
        setKeysError(res.error)
      } else {
        const updated = await getDomain()
        setSavedRecord(updated)
        setGoogleClientId("")
        setGoogleClientSecret("")
      }
    })
  }

  function handleRemoveKeys() {
    startKeysTransition(async () => {
      const res = await removeGoogleKeys()
      if (res?.error) {
        setKeysError(res.error)
      } else {
        const updated = await getDomain()
        setSavedRecord(updated)
      }
    })
  }

  // App name handler
  function handleSaveAppName() {
    setAppNameError("")
    if (!appName.trim()) {
      setAppNameError("App name is required")
      return
    }
    startAppNameTransition(async () => {
      const res = await saveAppName(appName.trim())
      if (res?.error) {
        setAppNameError(res.error)
      } else {
        const updated = await getDomain()
        setSavedRecord(updated)
      }
    })
  }

  const statusColor = {
    verified: "bg-green-100 text-green-700",
    pending:  "bg-yellow-100 text-yellow-700",
    failed:   "bg-red-100 text-red-700",
  }

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-2xl font-semibold mb-2">White Label — Custom Domain</h1>
      <p className="text-gray-500 text-sm mb-8">
        Connect your own domain so your users see your brand, not ours.
      </p>

      {/* ── Domain Input ── */}
      <div className="flex gap-3 mb-4">
        <input
          type="text"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          placeholder="e.g. app.yourdomain.com"
          className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={handleSave}
          disabled={isPending || !domain}
          className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
        >
          {isPending ? "Saving..." : "Save"}
        </button>
      </div>

      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

      {/* ── Saved domain card ── */}
      {savedRecord && (
        <div className="border border-gray-200 rounded-xl p-5 mt-6">

          <div className="flex items-center justify-between mb-4">
            <span className="font-medium text-sm">{savedRecord.domain}</span>
            <span className={`text-xs px-3 py-1 rounded-full font-medium ${statusColor[savedRecord.status as keyof typeof statusColor]}`}>
              {savedRecord.status}
            </span>
          </div>

          {savedRecord.status !== "verified" && (
            <div className="bg-gray-50 rounded-lg p-4 mb-4 text-sm">
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setMethod("nameserver")}
                  className={`text-xs px-4 py-1.5 rounded-md font-medium border transition-all ${
                    method === "nameserver"
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-gray-600 border-gray-300"
                  }`}
                >
                  Nameservers
                </button>
                <button
                  onClick={() => setMethod("cname")}
                  className={`text-xs px-4 py-1.5 rounded-md font-medium border transition-all ${
                    method === "cname"
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-gray-600 border-gray-300"
                  }`}
                >
                  CNAME Record
                </button>
              </div>

              {method === "nameserver" && (
                <>
                  <p className="font-medium mb-1">Update your Nameservers to:</p>
                  <p className="text-gray-400 text-xs mb-3">Easiest method — Vercel handles everything automatically.</p>
                  <div className="grid grid-cols-2 gap-2 font-mono text-xs">
                    <div className="bg-white border rounded px-3 py-2 flex items-center justify-between col-span-2">
                      <span>ns1.vercel-dns.com</span>
                      <button onClick={() => navigator.clipboard.writeText("ns1.vercel-dns.com")} className="text-gray-400 hover:text-gray-600 ml-4">Copy</button>
                    </div>
                    <div className="bg-white border rounded px-3 py-2 flex items-center justify-between col-span-2">
                      <span>ns2.vercel-dns.com</span>
                      <button onClick={() => navigator.clipboard.writeText("ns2.vercel-dns.com")} className="text-gray-400 hover:text-gray-600 ml-4">Copy</button>
                    </div>
                  </div>
                </>
              )}

              {method === "cname" && (
                <>
                  <p className="font-medium mb-1">Add these DNS records at your registrar:</p>
                  <p className="text-gray-400 text-xs mb-3">Use this if you want to keep your existing DNS provider.</p>
                  <div className="grid grid-cols-2 gap-2 font-mono text-xs">
                    <div className="bg-white border rounded px-3 py-2">
                      <span className="text-gray-400 block mb-1">Type</span>A
                    </div>
                    <div className="bg-white border rounded px-3 py-2">
                      <span className="text-gray-400 block mb-1">Name</span>@
                    </div>
                    <div className="bg-white border rounded px-3 py-2 col-span-2 flex items-center justify-between">
                      <div>
                        <span className="text-gray-400 block mb-1">Value</span>
                        76.76.21.9
                      </div>
                      <button onClick={() => navigator.clipboard.writeText("76.76.21.9")} className="text-gray-400 hover:text-gray-600">Copy</button>
                    </div>
                    <div className="bg-white border rounded px-3 py-2 mt-2">
                      <span className="text-gray-400 block mb-1">Type</span>CNAME
                    </div>
                    <div className="bg-white border rounded px-3 py-2 mt-2">
                      <span className="text-gray-400 block mb-1">Name</span>www
                    </div>
                    <div className="bg-white border rounded px-3 py-2 col-span-2 flex items-center justify-between">
                      <div>
                        <span className="text-gray-400 block mb-1">Value</span>
                        cname.vercel-dns.com
                      </div>
                      <button onClick={() => navigator.clipboard.writeText("cname.vercel-dns.com")} className="text-gray-400 hover:text-gray-600">Copy</button>
                    </div>
                  </div>
                  <p className="text-gray-400 text-xs mt-3">⚠️ Delete any existing A records first.</p>
                </>
              )}

              <p className="text-gray-400 text-xs mt-3">
                DNS changes can take up to 24 hours to propagate.
              </p>
            </div>
          )}

          {savedRecord.status === "verified" && (
            <div className="bg-green-50 text-green-700 text-sm rounded-lg px-4 py-3 mb-4">
              ✅ Your domain is live and verified.
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleCheck}
              disabled={checking}
              className="text-sm border border-gray-300 px-4 py-2 rounded-lg disabled:opacity-50"
            >
              {checking ? "Checking..." : "Check verification"}
            </button>
            <button
              onClick={handleDelete}
              disabled={isPending}
              className="text-sm text-red-500 border border-red-200 px-4 py-2 rounded-lg disabled:opacity-50"
            >
              Remove domain
            </button>
          </div>
        </div>
      )}

      {/* ── App Name Section ── */}
      {savedRecord && (
        <div className="border border-gray-200 rounded-xl p-5 mt-6">
          <h2 className="text-base font-semibold mb-1">App Name</h2>
          <p className="text-gray-400 text-xs mb-4">
            This name will show in the browser tab and throughout your app.
          </p>

          <div className="flex gap-3">
            <input
              type="text"
              value={appName}
              onChange={(e) => setAppName(e.target.value)}
              placeholder="e.g. My Awesome App"
              className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleSaveAppName}
              disabled={appNamePending || !appName}
              className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
            >
              {appNamePending ? "Saving..." : "Save"}
            </button>
          </div>

          {appNameError && <p className="text-red-500 text-xs mt-2">{appNameError}</p>}

          {savedRecord.appName && (
            <p className="text-green-600 text-xs mt-2">
              ✅ Current name: <span className="font-medium">{savedRecord.appName}</span>
            </p>
          )}
        </div>
      )}

      {/* ── Google OAuth Keys Section ── */}
      {savedRecord && (
        <div className="border border-gray-200 rounded-xl p-5 mt-6">
          <h2 className="text-base font-semibold mb-1">Google OAuth Setup</h2>
          <p className="text-gray-400 text-xs mb-4">
            Add your own Google OAuth keys so Google login works on your custom domain.
          </p>

          <div className="bg-blue-50 rounded-lg p-4 mb-4 text-xs text-blue-700">
            <p className="font-medium mb-2">How to get your Google OAuth keys:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Go to <span className="font-mono">console.cloud.google.com</span></li>
              <li>Create a new project or select existing</li>
              <li>Go to <span className="font-mono">APIs & Services → Credentials</span></li>
              <li>Click <span className="font-mono">Create Credentials → OAuth 2.0 Client ID</span></li>
              <li>Application type: <span className="font-mono">Web application</span></li>
              <li>Authorized JavaScript origins:
                <span className="font-mono block mt-1 bg-blue-100 px-2 py-1 rounded">
                  https://{savedRecord.domain}
                </span>
              </li>
              <li>Authorized redirect URIs:
                <span className="font-mono block mt-1 bg-blue-100 px-2 py-1 rounded">
                  https://{savedRecord.domain}/api/auth/callback/google
                </span>
              </li>
              <li>Copy Client ID and Secret below</li>
            </ol>
          </div>

          {savedRecord.googleClientId ? (
            <div className="bg-green-50 rounded-lg px-4 py-3 mb-4 flex items-center justify-between">
              <div>
                <p className="text-green-700 text-sm font-medium">✅ Google OAuth keys saved</p>
                <p className="text-green-600 text-xs mt-0.5">Google login is active on your domain</p>
              </div>
              <button
                onClick={handleRemoveKeys}
                disabled={keysPending}
                className="text-xs text-red-500 border border-red-200 px-3 py-1.5 rounded-lg disabled:opacity-50"
              >
                Remove keys
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <div>
                <label className="text-xs text-gray-500 block mb-1">Client ID</label>
                <input
                  type="text"
                  value={googleClientId}
                  onChange={(e) => setGoogleClientId(e.target.value)}
                  placeholder="xxxxx.apps.googleusercontent.com"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Client Secret</label>
                <input
                  type="password"
                  value={googleClientSecret}
                  onChange={(e) => setGoogleClientSecret(e.target.value)}
                  placeholder="GOCSPX-xxxxxxxxxxxx"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>

              {keysError && <p className="text-red-500 text-xs">{keysError}</p>}

              <button
                onClick={handleSaveKeys}
                disabled={keysPending}
                className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium disabled:opacity-50 w-fit"
              >
                {keysPending ? "Saving..." : "Save Google Keys"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}