import type React from "react";
import { useState } from "react";
import type { WalletId } from "../../entities/wallet/model";
import { useAuth } from "../../app/providers/AuthProvider";
import { Button } from "../../shared/ui/Button";
import { Input } from "../../shared/ui/Input";
import { Modal } from "../../shared/ui/Modal";
import { WALLET_LABELS } from "../../shared/config/constants";
import { verifyPassword } from "./model";
import "./AuthButton.css";

type AuthButtonProps = {
  walletId: WalletId;
};

export function AuthButton({ walletId }: AuthButtonProps) {
  const { canEdit, authenticate, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const editable = canEdit(walletId);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      if (await verifyPassword(walletId, password)) {
        authenticate(walletId);
        setOpen(false);
        setPassword("");
      } else {
        setError("비밀번호가 맞지 않습니다.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (editable) {
    return (
      <Button variant="secondary" onClick={signOut}>
        인증 해제
      </Button>
    );
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>토사장 인증</Button>
      <Modal title={`${WALLET_LABELS[walletId]} 인증`} open={open} onClose={() => setOpen(false)}>
        <form className="auth-form" onSubmit={submit}>
          <Input
            autoFocus
            type="password"
            placeholder="비밀번호"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          {error && <p className="auth-error">{error}</p>}
          <div className="modal-actions">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              취소
            </Button>
            <Button type="submit" disabled={submitting}>
              확인
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
