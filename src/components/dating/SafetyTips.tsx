"use client";

import { Shield, AlertTriangle, MessageSquare, UserX, Heart } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function SafetyTips() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <Shield className="w-4 h-4" />
          Safety Tips
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-purple-500" />
            Dating Safety Tips
          </DialogTitle>
          <DialogDescription>
            Your safety is our priority. Follow these guidelines to stay safe while dating.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Meeting in Person */}
          <div className="border-l-4 border-purple-500 pl-4">
            <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <Heart className="w-5 h-5 text-purple-500" />
              Meeting in Person
            </h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li>• Meet in a public place for your first few dates</li>
              <li>• Tell a friend or family member where you&apos;re going and who you&apos;re meeting</li>
              <li>• Keep your phone charged and with you</li>
              <li>• Trust your instincts - if something feels off, leave</li>
              <li>• Don&apos;t share your home address until you&apos;re comfortable</li>
            </ul>
          </div>

          {/* Online Safety */}
          <div className="border-l-4 border-blue-500 pl-4">
            <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-blue-500" />
              Online Safety
            </h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li>• Never share financial information or send money</li>
              <li>• Be cautious of users who ask for personal information too quickly</li>
              <li>• Report suspicious behavior or fake profiles immediately</li>
              <li>• Use the block feature if someone makes you uncomfortable</li>
              <li>• Keep conversations on the platform until you&apos;re comfortable</li>
            </ul>
          </div>

          {/* Red Flags */}
          <div className="border-l-4 border-red-500 pl-4">
            <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Red Flags to Watch For
            </h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li>• Asking for money or financial help</li>
              <li>• Pressuring you to meet in private or isolated locations</li>
              <li>• Refusing to video chat or meet in person</li>
              <li>• Inconsistent stories or information</li>
              <li>• Aggressive or threatening language</li>
              <li>• Asking for explicit photos or content</li>
            </ul>
          </div>

          {/* Reporting */}
          <div className="border-l-4 border-orange-500 pl-4">
            <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <UserX className="w-5 h-5 text-orange-500" />
              Reporting & Blocking
            </h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li>• Use the report button if someone violates our community guidelines</li>
              <li>• Block users who make you feel uncomfortable</li>
              <li>• Report fake profiles, harassment, or inappropriate behavior</li>
              <li>• Our team reviews all reports and takes appropriate action</li>
              <li>• You can unblock users later if you change your mind</li>
            </ul>
          </div>

          {/* Emergency Resources */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">Emergency Resources</h3>
            <p className="text-sm text-gray-700 mb-2">
              If you&apos;re in immediate danger, call 911 or your local emergency services.
            </p>
            <p className="text-sm text-gray-700">
              For support with dating safety, visit{" "}
              <a
                href="https://www.rainn.org"
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-600 hover:underline"
              >
                RAINN.org
              </a>{" "}
              or{" "}
              <a
                href="https://www.loveisrespect.org"
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-600 hover:underline"
              >
                LoveIsRespect.org
              </a>
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}


