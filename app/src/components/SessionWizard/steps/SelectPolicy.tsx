'use client';

import Image from 'next/image';
import Button from '@/@abstract-ui/components/Button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/Card';
import { buildDefaultPolicyPreview } from '@/lib/policy-compiler';
import { useSessionWizardState } from '@/hooks/useSessionWizardState';
import styles from '../styles.module.scss';

const PERMISSIONS = [
  {
    label: 'Transfer tokens',
    detail: 'Send tokens and native currency',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 12L12 4M12 4H6M12 4V10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    label: 'Sign typed data',
    detail: 'Approve typed-data signatures for supported flows',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M9.5 3.5L12.5 6.5L6 13H3V10L9.5 3.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    label: 'Smart contracts',
    detail: 'Execute reads and writes on-chain',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M5 3L2 8L5 13M11 3L14 8L11 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    label: 'Swap tokens',
    detail: 'Trade via supported DEXs',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 5H4M4 5L6.5 2.5M4 5L6.5 7.5M4 11H12M12 11L9.5 8.5M12 11L9.5 13.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
] as const;

export default function SelectPolicy({ authPublicKey }: { authPublicKey: string }) {
  const {
    agwAddress,
    dangerAcknowledged,
    setDangerAcknowledged,
    proceedToCreating,
    setValidationError,
  } = useSessionWizardState();

  const displayAddress = agwAddress ? `${agwAddress.slice(0, 6)}...${agwAddress.slice(-4)}` : 'Wallet';
  const deviceKeyPreview = `${authPublicKey.slice(0, 10)}...${authPublicKey.slice(-10)}`;

  const handleAuthorize = () => {
    if (!dangerAcknowledged) {
      setValidationError('Confirm that you understand the access you are granting.');
      return;
    }

    proceedToCreating(buildDefaultPolicyPreview());
  };

  return (
    <div className={styles.wrapper}>
      <Card className={styles.mainCard}>
        <CardHeader className={styles.mainHeader}>
          <div className={styles.identity}>
            <div className={styles.logoWrap}>
              <Image
                src="/assets/images/Abstract_AppIcon_LightMode.svg"
                alt="Abstract AGW icon"
                width={68}
                height={68}
                priority
              />
            </div>
            <h2 className={styles.walletAddress}>{displayAddress}</h2>
            <p className={styles.walletLabel}>AGW Wallet</p>
          </div>
        </CardHeader>
        <CardContent className={styles.mainBody}>
          <p className={styles.sectionTitle}>Delegated Agent Access</p>
          <p className={styles.consentSubtitle}>
            You are adding a new AGW MCP signer for this device. The remote policy is bounded to
            this chain, expires automatically, and caps native value per request.
          </p>
          <p className={styles.helper}>Device key: <code>{deviceKeyPreview}</code></p>

          <div className={styles.permissionList}>
            {PERMISSIONS.map(permission => (
              <div key={permission.label} className={styles.permissionItem}>
                <span className={styles.permissionIcon} aria-hidden="true">
                  {permission.icon}
                </span>
                <div>
                  <p className={styles.permissionLabel}>{permission.label}</p>
                  <p className={styles.permissionDetail}>{permission.detail}</p>
                </div>
              </div>
            ))}
          </div>

          <label className={styles.consentAck}>
            <input
              type="checkbox"
              checked={dangerAcknowledged}
              onChange={event => setDangerAcknowledged(event.target.checked)}
            />
            <span>I understand that this approval adds a new AGW MCP signer to my wallet for this device. I can revoke it later, but any signed transactions remain final and irreversible.</span>
          </label>
        </CardContent>
        <CardFooter className={styles.mainFooter}>
          <div className={styles.buttonRow}>
            <Button
              className={styles.footerButton}
              height="40"
              variant="primary"
              onClick={handleAuthorize}
              disabled={!dangerAcknowledged}
            >
              Authorize Agent
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
