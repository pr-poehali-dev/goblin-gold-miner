import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';

const GAME_API = 'https://functions.poehali.dev/e2a9b6ca-d781-44f6-9568-29dbaf48455b';
const MARKET_API = 'https://functions.poehali.dev/97747066-a739-4755-b2da-0ddb0b7f946a';

const Index = () => {
  const [userId] = useState(() => {
    const stored = localStorage.getItem('goblin_user_id');
    if (stored) return stored;
    const newId = 'user_' + Math.random().toString(36).substring(7);
    localStorage.setItem('goblin_user_id', newId);
    return newId;
  });

  const [goblins, setGoblins] = useState(3000);
  const [gold, setGold] = useState(0);
  const [tonBalance, setTonBalance] = useState(0);
  const [memo, setMemo] = useState('------');
  const [activeTab, setActiveTab] = useState('mining');
  const [marketListings, setMarketListings] = useState<Array<{id: number, seller: string, amount: number, price: number, total: number}>>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const goldPerHour = goblins * 0.014;
  const goldPerSecond = goldPerHour / 3600;

  useEffect(() => {
    const init = async () => {
      try {
        const response = await fetch(`${GAME_API}?action=init`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: userId })
        });
        const data = await response.json();
        setGoblins(data.goblins);
        setGold(data.gold);
        setTonBalance(data.ton_balance);
        setMemo(data.memo);
      } catch (error) {
        console.error('Init error:', error);
      }
    };
    
    init();
    loadMarketListings();
    
    const interval = setInterval(() => {
      setGold(prev => prev + goldPerSecond);
    }, 1000);

    return () => clearInterval(interval);
  }, [userId, goldPerSecond]);

  const initPlayer = async () => {
    try {
      const response = await fetch(`${GAME_API}?action=init`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId })
      });
      const data = await response.json();
      setGoblins(data.goblins);
      setGold(data.gold);
      setTonBalance(data.ton_balance);
      setMemo(data.memo);
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Не удалось загрузить данные', variant: 'destructive' });
    }
  };

  const loadMarketListings = async () => {
    try {
      const response = await fetch(`${MARKET_API}?action=listings`);
      const data = await response.json();
      setMarketListings(data.listings || []);
    } catch (error) {
      console.error('Ошибка загрузки маркета:', error);
    }
  };

  const buyGoblins = async (packageType: string) => {
    setLoading(true);
    try {
      const response = await fetch(`${GAME_API}?action=buy-goblins`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, package: packageType })
      });
      const data = await response.json();
      
      if (data.error) {
        toast({ title: 'Ошибка', description: data.error, variant: 'destructive' });
      } else {
        setGoblins(data.new_goblins);
        setTonBalance(data.new_balance);
        toast({ title: 'Успешно!', description: `Куплено ${packageType === 'small' ? '3000' : '15000'} гоблинов` });
      }
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Не удалось купить гоблинов', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const exchangeGold = async () => {
    const goldInput = document.getElementById('gold-exchange') as HTMLInputElement;
    const amount = parseFloat(goldInput?.value || '0');
    
    if (amount < 100) {
      toast({ title: 'Ошибка', description: 'Минимум 100 кг золота', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${GAME_API}?action=exchange-gold`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, gold_amount: amount })
      });
      const data = await response.json();
      
      if (data.error) {
        toast({ title: 'Ошибка', description: data.error, variant: 'destructive' });
      } else {
        setGold(data.new_gold);
        setGoblins(data.new_goblins);
        toast({ title: 'Успешно!', description: `Получено ${data.goblins_received} гоблинов` });
        if (goldInput) goldInput.value = '';
      }
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Не удалось обменять золото', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const createListing = async () => {
    const amountInput = document.getElementById('sell-gold-amount') as HTMLInputElement;
    const priceInput = document.getElementById('sell-gold-price') as HTMLInputElement;
    
    const amount = parseFloat(amountInput?.value || '0');
    const price = parseFloat(priceInput?.value || '0');
    
    if (amount < 100) {
      toast({ title: 'Ошибка', description: 'Минимум 100 кг золота', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${MARKET_API}?action=create-listing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, gold_amount: amount, price_per_kg: price })
      });
      const data = await response.json();
      
      if (data.error) {
        toast({ title: 'Ошибка', description: data.error, variant: 'destructive' });
      } else {
        setGold(data.new_gold);
        toast({ title: 'Успешно!', description: 'Объявление создано' });
        loadMarketListings();
        if (amountInput) amountInput.value = '';
        if (priceInput) priceInput.value = '';
      }
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Не удалось создать объявление', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const buyListing = async (listingId: number) => {
    setLoading(true);
    try {
      const response = await fetch(`${MARKET_API}?action=buy-listing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, listing_id: listingId })
      });
      const data = await response.json();
      
      if (data.error) {
        toast({ title: 'Ошибка', description: data.error, variant: 'destructive' });
      } else {
        setGold(data.new_gold);
        setTonBalance(data.new_balance);
        toast({ title: 'Успешно!', description: `Куплено золото за ${data.paid.toFixed(4)} TON` });
        loadMarketListings();
      }
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Не удалось купить золото', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const topUpBalance = () => {
    toast({ 
      title: 'Пополнение баланса', 
      description: `Тестовое пополнение: +10 TON (в проде нужна TON интеграция)` 
    });
    setTonBalance(prev => prev + 10);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1625] via-[#1f1933] to-[#251e3d] p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="text-center space-y-2 mb-8">
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent animate-pulse-soft">
            ⚔️ Goblin Gold Mine ⚔️
          </h1>
          <p className="text-muted-foreground text-lg">Добывайте золото, торгуйте и богатейте!</p>
        </div>

        <Card className="bg-card/50 backdrop-blur-sm border-primary/20 p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center space-y-2 p-4 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30">
              <div className="text-6xl animate-float">👺</div>
              <div className="text-sm text-muted-foreground">Гоблины на работе</div>
              <div className="text-3xl font-bold text-primary">{goblins.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">
                {goldPerHour.toFixed(2)} кг/час
              </div>
            </div>

            <div className="text-center space-y-2 p-4 rounded-lg bg-gradient-to-br from-secondary/20 to-secondary/5 border border-secondary/30">
              <div className="text-6xl animate-pulse-soft">✨</div>
              <div className="text-sm text-muted-foreground">Добыто золота</div>
              <div className="text-3xl font-bold text-gold">{gold.toFixed(2)} кг</div>
              <div className="text-xs text-accent">
                +{goldPerSecond.toFixed(4)} кг/сек
              </div>
            </div>

            <div className="text-center space-y-2 p-4 rounded-lg bg-gradient-to-br from-accent/20 to-accent/5 border border-accent/30">
              <div className="text-6xl">💎</div>
              <div className="text-sm text-muted-foreground">Баланс TON</div>
              <div className="text-3xl font-bold text-accent">{tonBalance.toFixed(2)}</div>
              <Badge variant="outline" className="text-xs border-accent/50">
                MEMO: {memo}
              </Badge>
            </div>
          </div>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-card/50 backdrop-blur-sm">
            <TabsTrigger value="mining" className="data-[state=active]:bg-primary/20">
              <Icon name="Pickaxe" className="w-4 h-4 mr-2" />
              Майнинг
            </TabsTrigger>
            <TabsTrigger value="market" className="data-[state=active]:bg-secondary/20">
              <Icon name="ShoppingCart" className="w-4 h-4 mr-2" />
              P2P Маркет
            </TabsTrigger>
            <TabsTrigger value="wallet" className="data-[state=active]:bg-accent/20">
              <Icon name="Wallet" className="w-4 h-4 mr-2" />
              Кошелёк
            </TabsTrigger>
          </TabsList>

          <TabsContent value="mining" className="space-y-4 mt-6">
            <Card className="p-6 bg-card/50 backdrop-blur-sm border-primary/20">
              <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Icon name="Coins" className="text-secondary" />
                Купить гоблинов
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-muted">
                  <div>
                    <div className="font-semibold text-lg">3000 гоблинов</div>
                    <div className="text-sm text-muted-foreground">+42 кг золота в час</div>
                  </div>
                  <Button 
                    className="bg-primary hover:bg-primary/90"
                    onClick={() => buyGoblins('small')}
                    disabled={loading || tonBalance < 1}
                  >
                    <Icon name="Plus" className="w-4 h-4 mr-2" />
                    1 TON
                  </Button>
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-muted">
                  <div>
                    <div className="font-semibold text-lg">15000 гоблинов</div>
                    <div className="text-sm text-muted-foreground">+210 кг золота в час</div>
                  </div>
                  <Button 
                    className="bg-primary hover:bg-primary/90"
                    onClick={() => buyGoblins('large')}
                    disabled={loading || tonBalance < 5}
                  >
                    <Icon name="Plus" className="w-4 h-4 mr-2" />
                    5 TON
                  </Button>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-card/50 backdrop-blur-sm border-secondary/20">
              <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Icon name="Repeat" className="text-secondary" />
                Обменять золото на гоблинов
              </h3>
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-secondary/10 border border-secondary/30">
                  <div className="text-sm text-muted-foreground mb-2">Курс обмена</div>
                  <div className="text-xl font-bold text-secondary">100 кг золота = 95 гоблинов</div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="gold-exchange">Золото (кг)</Label>
                    <Input 
                      id="gold-exchange" 
                      type="number" 
                      placeholder="100" 
                      className="mt-2 bg-muted/30"
                    />
                  </div>
                  <div>
                    <Label>Получите гоблинов</Label>
                    <div className="mt-2 h-10 px-3 rounded-md bg-muted/30 border border-muted flex items-center text-muted-foreground">
                      95
                    </div>
                  </div>
                </div>
                <Button 
                  className="w-full bg-secondary hover:bg-secondary/90"
                  onClick={exchangeGold}
                  disabled={loading}
                >
                  <Icon name="ArrowRightLeft" className="w-4 h-4 mr-2" />
                  Обменять
                </Button>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="market" className="space-y-4 mt-6">
            <Card className="p-6 bg-card/50 backdrop-blur-sm border-secondary/20">
              <div className="mb-6">
                <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <Icon name="Store" className="text-secondary" />
                  Продать золото
                </h3>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <Label htmlFor="sell-gold-amount">Количество (кг)</Label>
                    <Input 
                      id="sell-gold-amount" 
                      type="number" 
                      placeholder="100" 
                      className="mt-2 bg-muted/30"
                    />
                  </div>
                  <div>
                    <Label htmlFor="sell-gold-price">Цена за кг (TON)</Label>
                    <Input 
                      id="sell-gold-price" 
                      type="number" 
                      step="0.001"
                      placeholder="0.045" 
                      className="mt-2 bg-muted/30"
                    />
                  </div>
                </div>
                <Button 
                  className="w-full bg-accent hover:bg-accent/90"
                  onClick={createListing}
                  disabled={loading}
                >
                  <Icon name="Plus" className="w-4 h-4 mr-2" />
                  Создать объявление
                </Button>
              </div>

              <div className="border-t border-border pt-6">
                <h3 className="text-xl font-bold mb-4">Активные объявления</h3>
                {marketListings.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Пока нет объявлений</p>
                ) : (
                  <div className="space-y-3">
                    {marketListings.map((listing) => (
                      <div 
                        key={listing.id}
                        className="p-4 rounded-lg bg-muted/30 border border-muted hover:border-accent/50 transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {listing.seller}
                              </Badge>
                              <span className="text-sm text-muted-foreground">продаёт</span>
                            </div>
                            <div className="font-bold text-lg text-gold">
                              {listing.amount} кг золота
                            </div>
                            <div className="text-sm text-muted-foreground">
                              по {listing.price} TON за кг
                            </div>
                          </div>
                          <div className="text-right space-y-2">
                            <div className="text-2xl font-bold text-accent">
                              {listing.total.toFixed(2)} TON
                            </div>
                            <Button 
                              size="sm" 
                              className="bg-accent hover:bg-accent/90"
                              onClick={() => buyListing(listing.id)}
                              disabled={loading}
                            >
                              <Icon name="ShoppingBag" className="w-4 h-4 mr-2" />
                              Купить
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-6 p-4 rounded-lg bg-accent/10 border border-accent/30">
                <div className="text-sm text-muted-foreground">
                  💡 <span className="font-semibold">Комиссия:</span> 5% с продавца + 5% с покупателя
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  📦 <span className="font-semibold">Минимум для продажи:</span> 100 кг золота
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="wallet" className="space-y-4 mt-6">
            <Card className="p-6 bg-card/50 backdrop-blur-sm border-accent/20">
              <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Icon name="Download" className="text-accent" />
                Пополнить баланс
              </h3>
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-accent/10 border border-accent/30">
                  <div className="text-sm text-muted-foreground mb-2">Ваш уникальный MEMO код</div>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-2xl font-bold text-accent bg-muted/30 p-3 rounded-md">
                      {memo}
                    </code>
                    <Button variant="outline" size="icon">
                      <Icon name="Copy" className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-muted/30 border border-muted">
                  <div className="text-sm font-semibold mb-2">📝 Инструкция по пополнению:</div>
                  <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                    <li>Откройте ваш TON кошелёк</li>
                    <li>Отправьте любую сумму TON на адрес проекта</li>
                    <li>В поле MEMO укажите ваш код: <span className="font-mono font-bold text-foreground">{memo}</span></li>
                    <li>Баланс обновится автоматически через 1-2 минуты</li>
                  </ol>
                </div>
                <Button 
                  className="w-full bg-accent hover:bg-accent/90"
                  onClick={topUpBalance}
                >
                  Тестовое пополнение +10 TON
                </Button>
              </div>
            </Card>

            <Card className="p-6 bg-card/50 backdrop-blur-sm border-destructive/20">
              <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Icon name="Upload" className="text-destructive" />
                Вывести средства
              </h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="withdraw-address">Адрес TON кошелька</Label>
                  <Input 
                    id="withdraw-address" 
                    placeholder="EQD..." 
                    className="mt-2 bg-muted/30"
                  />
                </div>
                <div>
                  <Label htmlFor="withdraw-amount">Сумма (TON)</Label>
                  <Input 
                    id="withdraw-amount" 
                    type="number" 
                    placeholder="0.00" 
                    className="mt-2 bg-muted/30"
                  />
                </div>
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-sm text-muted-foreground">
                  ⚠️ Минимальная сумма вывода: 1 TON. Комиссия сети: ~0.01 TON
                </div>
                <Button className="w-full bg-destructive hover:bg-destructive/90" disabled>
                  <Icon name="Send" className="w-4 h-4 mr-2" />
                  Вывести (скоро)
                </Button>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;