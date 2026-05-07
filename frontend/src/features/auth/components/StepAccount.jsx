import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const StepAccount = ({ data, updateData, onNext, onBack, onSkip }) => {
  const { account } = data;

  return (
    <div className="onboard-card p-6 md:p-12 relative animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="onboard-progress flex items-center gap-2 mb-8 md:mb-9">
        <div className="prog-step done"></div>
        <div className="prog-step done"></div>
        <div className="prog-step active"></div>
      </div>
      
      <div className="flex items-center gap-4 mb-6 md:mb-8">
        <div className="w-12 h-12 md:w-14 md:h-14 rounded-[14px] bg-accent/15 border border-accent/20 flex items-center justify-center text-xl md:text-2xl shrink-0">
          🏦
        </div>
        <div>
          <h1 className="text-xl md:text-[26px] font-bold tracking-[-0.4px] leading-tight">
            Add your first account
          </h1>
          <p className="text-xs md:text-sm text-text2 leading-relaxed">
            Your Cash account is ready. Add a bank account to start tracking.
          </p>
        </div>
      </div>
      
      <div className="bg-green/10 border border-green/20 rounded-[10px] p-3 flex items-center gap-2.5 mb-4 text-xs md:text-[13px]">
        <span className="text-base md:text-lg">✅</span>
        <div>
          <div className="font-semibold text-green">Cash account ready</div>
          <div className="text-[10px] md:text-[11px] text-text3">Auto-created — balance: ₹0.00</div>
        </div>
      </div>
      
      <div className="space-y-4 mb-6 md:mb-7">
        <div>
          <label className="text-[10px] md:text-[11px] font-semibold text-text3 uppercase tracking-[0.08em] mb-1.5 block">Account Type</label>
          <Select 
            value={account.type} 
            onValueChange={(val) => updateData({ account: { ...account, type: val } })}
          >
            <SelectTrigger className="w-full bg-bg3 border-border text-text h-10">
              <SelectValue placeholder="Select Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Bank Account">Bank Account</SelectItem>
              <SelectItem value="Credit Card">Credit Card</SelectItem>
              <SelectItem value="Investment">Investment</SelectItem>
              <SelectItem value="E-Wallet">E-Wallet</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <label className="text-[10px] md:text-[11px] font-semibold text-text3 uppercase tracking-[0.08em] mb-1.5 block">Account Name</label>
          <Input 
            placeholder="e.g. HDFC Savings"
            value={account.name}
            onChange={(e) => updateData({ account: { ...account, name: e.target.value } })}
          />
        </div>
        
        <div className="flex flex-wrap gap-3">
          <div className="w-full md:w-[calc(50%-6px)]">
            <label className="text-[10px] md:text-[11px] font-semibold text-text3 uppercase tracking-[0.08em] mb-1.5 block">Last 4 digits (optional)</label>
            <Input 
              placeholder="1234"
              value={account.lastDigits}
              onChange={(e) => updateData({ account: { ...account, lastDigits: e.target.value } })}
            />
          </div>
          <div className="w-full md:w-[calc(50%-6px)]">
            <label className="text-[10px] md:text-[11px] font-semibold text-text3 uppercase tracking-[0.08em] mb-1.5 block">Opening Balance</label>
            <Input 
              placeholder="₹ 0"
              value={account.balance}
              onChange={(e) => updateData({ account: { ...account, balance: e.target.value } })}
            />
          </div>
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row gap-3 items-center mb-4">
        <div className="flex w-full md:w-auto gap-2">
          <Button 
            variant="outline"
            className="flex-1 md:w-20 rounded-[10px] text-[13px] font-medium h-auto py-2.5 md:py-[11px]"
            onClick={onBack}
          >
            Back
          </Button>
          <Button 
            variant="outline"
            className="flex-1 md:w-20 rounded-[10px] text-[13px] font-medium h-auto py-2.5 md:py-[11px]"
            onClick={onSkip}
          >
            Skip
          </Button>
        </div>
        <Button 
          className="w-full md:flex-1 rounded-[10px] font-semibold text-[13px] flex items-center justify-center gap-1.5 h-auto py-2.5 md:py-[11px]"
          onClick={onNext}
        >
          Add & Continue →
        </Button>
      </div>
    </div>
  );
};

export default StepAccount;
