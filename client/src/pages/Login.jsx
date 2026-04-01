import React, { useState } from 'react'
import { assets } from '../assets/assets'
import { SignIn } from '@clerk/clerk-react'

/* ─────────────────────────────────────────────
   Windows 2000 helper components
───────────────────────────────────────────── */

/** Classic W2K beveled border (outset 3-D look) */
const Win2KPanel = ({ children, className = '' }) => (
  <div
    className={`${className}`}
    style={{
      background: '#d4d0c8',
      border: '2px solid',
      borderColor: '#ffffff #808080 #808080 #ffffff',
      boxShadow: 'inset 1px 1px 0 #dfdfdf, inset -1px -1px 0 #ababab',
    }}
  >
    {children}
  </div>
)

/** Sunken / inset panel */
const Win2KInset = ({ children, className = '' }) => (
  <div
    className={`${className}`}
    style={{
      background: '#ffffff',
      border: '2px solid',
      borderColor: '#808080 #dfdfdf #dfdfdf #808080',
      boxShadow: 'inset 1px 1px 0 #ababab',
    }}
  >
    {children}
  </div>
)

/** Classic blue gradient title-bar */
const TitleBar = ({ title, onClose, onMinimize, onMaximize }) => (
  <div
    className="flex items-center justify-between px-1 py-0.5 select-none cursor-default"
    style={{
      background: 'linear-gradient(to right, #0a246a, #a6caf0)',
      minHeight: '22px',
    }}
  >
    <div className="flex items-center gap-1">
      {/* tiny pixel icon */}
      <span style={{ fontSize: '12px', lineHeight: 1 }}>🖥️</span>
      <span
        style={{
          color: '#fff',
          fontSize: '11px',
          fontFamily: 'Tahoma, Arial, sans-serif',
          fontWeight: 'bold',
          textShadow: '1px 1px 0 #00008b',
        }}
      >
        {title}
      </span>
    </div>
    <div className="flex items-center gap-0.5">
      {[
        { label: '─', action: onMinimize },
        { label: '□', action: onMaximize },
        { label: '✕', action: onClose, danger: true },
      ].map(({ label, action, danger }) => (
        <button
          key={label}
          onClick={action}
          style={{
            width: '16px',
            height: '14px',
            fontSize: '9px',
            lineHeight: '14px',
            textAlign: 'center',
            background: '#d4d0c8',
            border: '1px solid',
            borderColor: '#ffffff #808080 #808080 #ffffff',
            color: '#000',
            cursor: 'default',
            padding: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'Tahoma, Arial, sans-serif',
          }}
        >
          {label}
        </button>
      ))}
    </div>
  </div>
)

/** Classic W2K button */
const Win2KButton = ({ children, onClick, primary = false, className = '' }) => (
  <button
    onClick={onClick}
    className={`px-4 py-0.5 text-xs cursor-default active:scale-100 ${className}`}
    style={{
      fontFamily: 'Tahoma, Arial, sans-serif',
      fontSize: '11px',
      background: '#d4d0c8',
      border: '2px solid',
      borderColor: primary
        ? '#0000cd #000080 #000080 #0000cd'
        : '#ffffff #808080 #808080 #ffffff',
      boxShadow: primary
        ? 'inset 1px 1px 0 #dfdfdf, inset -1px -1px 0 #808080, 0 0 0 1px #000'
        : 'inset 1px 1px 0 #dfdfdf, inset -1px -1px 0 #ababab',
      minWidth: '75px',
      height: '23px',
      color: '#000',
    }}
  >
    {children}
  </button>
)

/** Desktop icon */
const DesktopIcon = ({ icon, label }) => (
  <div
    className="flex flex-col items-center gap-0.5 cursor-default select-none w-16 text-center"
    style={{ color: '#fff', fontFamily: 'Tahoma, Arial, sans-serif', fontSize: '11px' }}
  >
    <div style={{ fontSize: '32px', lineHeight: 1, filter: 'drop-shadow(1px 1px 2px #000)' }}>
      {icon}
    </div>
    <span
      style={{
        textShadow: '1px 1px 1px #000',
        lineHeight: '1.2',
        background: 'transparent',
      }}
    >
      {label}
    </span>
  </div>
)

/** Start button */
const StartButton = () => (
  <button
    className="flex items-center gap-1 h-7 px-2"
    style={{
      background: '#d4d0c8',
      border: '2px solid',
      borderColor: '#ffffff #808080 #808080 #ffffff',
      boxShadow: 'inset 1px 1px 0 #dfdfdf, inset -1px -1px 0 #ababab',
      fontFamily: 'Tahoma, Arial, sans-serif',
      fontSize: '11px',
      fontWeight: 'bold',
      cursor: 'default',
      color: '#000',
    }}
  >
    <span style={{ fontSize: '14px' }}>🪟</span>
    <span>Start</span>
  </button>
)

/* ─────────────────────────────────────────────
   Main Login Component
───────────────────────────────────────────── */

const Login = () => {
  const [minimized, setMinimized] = useState(false)

  /* system time */
  const now = new Date()
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        /* Classic Win2K teal/blue desktop wallpaper */
        background: '#008080',
        backgroundImage: `
          radial-gradient(circle at 20% 30%, rgba(0,120,120,0.6) 0%, transparent 50%),
          radial-gradient(circle at 80% 70%, rgba(0,60,100,0.5) 0%, transparent 50%)
        `,
        fontFamily: 'Tahoma, Arial, sans-serif',
        cursor: 'default',
      }}
    >
      {/* ── Desktop area ── */}
      <div className="flex-1 relative overflow-hidden">

        {/* Desktop icons - left column */}
        <div className="absolute top-6 left-6 flex flex-col gap-5">
          <DesktopIcon icon="🖥️" label="My Computer" />
          <DesktopIcon icon="📁" label="My Documents" />
          <DesktopIcon icon="🌐" label="Internet Explorer" />
          <DesktopIcon icon="🗑️" label="Recycle Bin" />
        </div>

        {/* Desktop icons - right column */}
        <div className="absolute top-6 right-6 flex flex-col gap-5">
          <DesktopIcon icon="📧" label="Outlook Express" />
          <DesktopIcon icon="🎵" label="Media Player" />
        </div>

        {/* ── PingUp Welcome Window ── */}
        {!minimized && (
          <div
            className="absolute"
            style={{
              top: '5%',
              left: '50%',
              transform: 'translateX(-50%)',
              width: 'min(560px, 95vw)',
              zIndex: 10,
            }}
          >
            <Win2KPanel>
              <TitleBar
                title="PingUp - Welcome"
                onMinimize={() => setMinimized(true)}
                onMaximize={() => {}}
                onClose={() => {}}
              />

              {/* Menu bar */}
              <div
                className="flex items-center gap-4 px-2 py-0.5"
                style={{
                  background: '#d4d0c8',
                  borderBottom: '1px solid #808080',
                  fontSize: '11px',
                }}
              >
                {['File', 'Edit', 'View', 'Favorites', 'Tools', 'Help'].map((item) => (
                  <span
                    key={item}
                    className="px-1 cursor-default"
                    style={{ textDecoration: item === 'File' ? 'underline' : 'none' }}
                  >
                    {item.charAt(0)}
                    <u>{item.slice(1)}</u>
                  </span>
                ))}
              </div>

              {/* Address bar */}
              <div
                className="flex items-center gap-2 px-2 py-1"
                style={{
                  background: '#d4d0c8',
                  borderBottom: '1px solid #808080',
                  fontSize: '11px',
                }}
              >
                <span style={{ fontSize: '11px' }}>Address</span>
                <Win2KInset className="flex-1 flex items-center px-2" style={{ height: '20px' }}>
                  <span style={{ fontSize: '11px', color: '#0000cc' }}>
                    http://pingup.local/login
                  </span>
                </Win2KInset>
                <Win2KButton>Go</Win2KButton>
              </div>

              {/* Content area */}
              <Win2KInset className="m-2">
                {/* Branding header */}
                <div
                  className="flex items-center gap-3 px-4 py-3"
                  style={{
                    background: 'linear-gradient(to right, #0a246a, #1e5fa8)',
                    borderBottom: '2px solid #808080',
                  }}
                >
                  <img src={assets.logo} alt="PingUp logo" style={{ height: '28px', filter: 'brightness(0) invert(1)' }} />
                  <div>
                    <p style={{ color: '#fff', fontSize: '11px', fontFamily: 'Tahoma, Arial, sans-serif' }}>
                      Social Network — Version 2000.1
                    </p>
                    <p style={{ color: '#a6caf0', fontSize: '10px', fontFamily: 'Tahoma, Arial, sans-serif' }}>
                      Used by 12,000+ users worldwide
                    </p>
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex" style={{ borderBottom: '2px solid #808080', background: '#d4d0c8' }}>
                  {['Sign In', 'New Account', 'Help'].map((tab, i) => (
                    <div
                      key={tab}
                      className="px-4 py-1"
                      style={{
                        fontSize: '11px',
                        background: i === 0 ? '#d4d0c8' : '#b0ada5',
                        borderRight: '1px solid #808080',
                        borderTop: i === 0 ? '2px solid #ffffff' : '1px solid #808080',
                        borderLeft: i === 0 ? '2px solid #ffffff' : '1px solid #dfdfdf',
                        marginBottom: i === 0 ? '-2px' : '0',
                        cursor: 'default',
                        fontWeight: i === 0 ? 'bold' : 'normal',
                      }}
                    >
                      {tab}
                    </div>
                  ))}
                </div>

                {/* Clerk SignIn - wrapped in white content box */}
                <div
                  className="p-4"
                  style={{ background: '#d4d0c8' }}
                >
                  {/* Info strip */}
                  <Win2KInset className="flex items-start gap-2 p-2 mb-3">
                    <span style={{ fontSize: '18px', flexShrink: 0 }}>ℹ️</span>
                    <p style={{ fontSize: '11px', lineHeight: '1.4', color: '#000' }}>
                      Welcome to <strong>PingUp</strong>. Please sign in or create a new account to
                      connect with your global community. This computer is for authorized users only.
                    </p>
                  </Win2KInset>

                  {/* Clerk SignIn component */}
                  <div
                    className="flex justify-center"
                    style={{
                      /* Override Clerk's styling to feel more retro */
                      '--cl-color-primary': '#0a246a',
                      '--cl-color-primary-hover': '#1e3a8a',
                      '--cl-color-background': '#d4d0c8',
                      '--cl-color-input-background': '#ffffff',
                      '--cl-border-radius': '0px',
                      '--cl-font-family': 'Tahoma, Arial, sans-serif',
                      '--cl-font-size-base': '11px',
                    }}
                  >
                    <SignIn />
                  </div>

                  {/* Bottom buttons */}
                  <div className="flex justify-end gap-2 mt-3 pt-2" style={{ borderTop: '1px solid #808080' }}>
                    <Win2KButton primary>OK</Win2KButton>
                    <Win2KButton>Cancel</Win2KButton>
                    <Win2KButton>Help</Win2KButton>
                  </div>
                </div>
              </Win2KInset>

              {/* Status bar */}
              <div
                className="flex items-center justify-between px-2 py-0.5"
                style={{
                  background: '#d4d0c8',
                  borderTop: '1px solid #808080',
                  fontSize: '10px',
                }}
              >
                <div className="flex items-center gap-3">
                  <Win2KInset className="px-2" style={{ height: '16px', display: 'flex', alignItems: 'center' }}>
                    <span>Done</span>
                  </Win2KInset>
                  <Win2KInset className="px-2" style={{ height: '16px', display: 'flex', alignItems: 'center' }}>
                    <span>Internet zone</span>
                  </Win2KInset>
                </div>
                <span style={{ color: '#444', fontSize: '10px' }}>🔒 Secure</span>
              </div>
            </Win2KPanel>
          </div>
        )}

        {/* Minimized window in taskbar placeholder */}
      </div>

      {/* ── Taskbar ── */}
      <div
        className="flex items-center gap-1 px-1"
        style={{
          background: '#d4d0c8',
          borderTop: '2px solid #ffffff',
          boxShadow: 'inset 0 1px 0 #dfdfdf',
          height: '30px',
          flexShrink: 0,
        }}
      >
        <StartButton />

        {/* Taskbar separator */}
        <div
          style={{
            width: '2px',
            height: '22px',
            background: 'linear-gradient(to right, #808080, #dfdfdf)',
            margin: '0 2px',
          }}
        />

        {/* Open window button */}
        {minimized ? (
          <button
            onClick={() => setMinimized(false)}
            style={{
              height: '22px',
              padding: '0 8px',
              fontSize: '11px',
              background: '#b0ada5',
              border: '2px solid',
              borderColor: '#808080 #ffffff #ffffff #808080',
              boxShadow: 'inset 1px 1px 0 #ababab',
              cursor: 'default',
              color: '#000',
            }}
          >
            🖥️ PingUp - Welcome
          </button>
        ) : (
          <button
            style={{
              height: '22px',
              padding: '0 8px',
              fontSize: '11px',
              background: '#d4d0c8',
              border: '2px solid',
              borderColor: '#ffffff #808080 #808080 #ffffff',
              boxShadow: 'inset 1px 1px 0 #dfdfdf, inset -1px -1px 0 #ababab',
              cursor: 'default',
              color: '#000',
              fontWeight: 'bold',
            }}
          >
            🖥️ PingUp - Welcome
          </button>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* System tray */}
        <div
          className="flex items-center gap-2 px-2"
          style={{
            background: '#d4d0c8',
            border: '1px solid',
            borderColor: '#808080 #dfdfdf #dfdfdf #808080',
            height: '22px',
            fontSize: '11px',
          }}
        >
          <span style={{ fontSize: '13px' }}>🔊</span>
          <span style={{ fontSize: '13px' }}>📶</span>
          <span
            style={{
              fontSize: '11px',
              fontFamily: 'Tahoma, Arial, sans-serif',
              color: '#000',
            }}
          >
            {timeStr}
          </span>
        </div>
      </div>
    </div>
  )
}

export default Login
