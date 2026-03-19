import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import axios from "axios";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { ProfileUser } from "@/types/profile";
import { AlertTriangleIcon } from "lucide-react";

interface AccountTabProps {
  currentUser: ProfileUser | null;
}

export default function AccountTab({
  currentUser,
}: AccountTabProps) {
  const navigate = useNavigate();
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [deactivateConfirmText, setDeactivateConfirmText] = useState("");
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert("两次输入的密码不一致");
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      alert("新密码至少需要6位");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      await axios.post(
        "/api/v1/users/me/change-password",
        {
          current_password: passwordForm.currentPassword,
          new_password: passwordForm.newPassword,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("密码修改成功");
      setShowChangePassword(false);
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch {
      alert("密码修改失败，请检查当前密码是否正确");
    }
  };

  const handleDeactivateAccount = async () => {
    if (deactivateConfirmText !== "DELETE") return;
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      await axios.post("/api/v1/users/me/deactivate", null, {
        headers: { Authorization: `Bearer ${token}` },
      });
      localStorage.removeItem("token");
      navigate("/login");
    } catch {
      alert("账号停用失败");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <Card>
        <CardHeader>
          <CardTitle>邮箱地址</CardTitle>
        </CardHeader>
        <CardContent>
        <div className="flex items-center justify-between">
          <div>
            <p>{currentUser?.email}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {currentUser?.email_verified ? "已验证" : "未验证"}
            </p>
          </div>
        </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>手机号码</CardTitle>
        </CardHeader>
        <CardContent>
        <p>
          {currentUser?.phone || "未绑定"}
        </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>密码</CardTitle>
        </CardHeader>
        <CardContent>
        {!showChangePassword ? (
          <Button
            onClick={() => setShowChangePassword(true)}
            variant="outline"
          >
            修改密码
          </Button>
        ) : (
          <div className="space-y-4">
            <Input
              type="password"
              placeholder="当前密码"
              value={passwordForm.currentPassword}
              onChange={(e) =>
                setPasswordForm((p) => ({
                  ...p,
                  currentPassword: e.target.value,
                }))
              }
            />
            <Input
              type="password"
              placeholder="新密码"
              value={passwordForm.newPassword}
              onChange={(e) =>
                setPasswordForm((p) => ({
                  ...p,
                  newPassword: e.target.value,
                }))
              }
            />
            <Input
              type="password"
              placeholder="确认新密码"
              value={passwordForm.confirmPassword}
              onChange={(e) =>
                setPasswordForm((p) => ({
                  ...p,
                  confirmPassword: e.target.value,
                }))
              }
            />
            <div className="flex gap-3">
              <Button onClick={handleChangePassword}>
                确认修改
              </Button>
              <Button
                onClick={() => setShowChangePassword(false)}
                variant="outline"
              >
                取消
              </Button>
            </div>
          </div>
        )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>危险区域</CardTitle>
          <CardDescription>
          停用账号后，您的所有数据将被保留但无法登录。
          </CardDescription>
        </CardHeader>
        <CardContent>
        <Button
          onClick={() => setShowDeactivateModal(true)}
          variant="destructive"
        >
          停用账号
        </Button>
        </CardContent>
      </Card>

      <AlertDialog open={showDeactivateModal} onOpenChange={setShowDeactivateModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia>
              <AlertTriangleIcon />
            </AlertDialogMedia>
            <AlertDialogTitle>
              确认停用账号
            </AlertDialogTitle>
            <AlertDialogDescription>
              此操作将停用您的账号。请输入{" "}
              <span className="text-red-400 font-mono">DELETE</span>{" "}
              以确认。
            </AlertDialogDescription>
          </AlertDialogHeader>
            <Input
              value={deactivateConfirmText}
              onChange={(e) => setDeactivateConfirmText(e.target.value)}
              placeholder='输入 "DELETE" 确认'
              className="mb-4"
            />
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeactivateAccount}
              disabled={deactivateConfirmText !== "DELETE"}
              variant="destructive"
            >
              确认停用
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
