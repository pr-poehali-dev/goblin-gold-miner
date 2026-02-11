import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';

const Index = () => {
  const [goblins, setGoblins] = useState(3000);
  const [gold, setGold] = useState(42.5);
  const [tonBalance, setTonBalance] = useState(0);
  const [memo] = useState('123456');
  const [activeTab, setActiveTab] = useState('mining');

  const goldPerHour = goblins * 0.014;
  const goldPerSecond = goldPerHour / 3600;

  const marketListings = [
    { id: 1, seller: 'Player#4521', amount: 150, price: 0.045, total: 6.75 },
    { id: 2, seller: 'Player#8392', amount: 250, price: 0.042, total: 10.5 },
    { id: 3, seller: 'Player#1247', amount: 500, price: 0.040, total: 20.0 },
    { id: 4, seller: 'Player#9876', amount: 100, price: 0.048, total: 4.8 },
  ];

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
                  <Button className="bg-primary hover:bg-primary/90">
                    <Icon name="Plus" className="w-4 h-4 mr-2" />
                    1 TON
                  </Button>
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-muted">
                  <div>
                    <div className="font-semibold text-lg">15000 гоблинов</div>
                    <div className="text-sm text-muted-foreground">+210 кг золота в час</div>
                  </div>
                  <Button className="bg-primary hover:bg-primary/90">
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
                <Button className="w-full bg-secondary hover:bg-secondary/90">
                  <Icon name="ArrowRightLeft" className="w-4 h-4 mr-2" />
                  Обменять
                </Button>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="market" className="space-y-4 mt-6">
            <Card className="p-6 bg-card/50 backdrop-blur-sm border-secondary/20">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold flex items-center gap-2">
                  <Icon name="Store" className="text-secondary" />
                  P2P Маркет золота
                </h3>
                <Button className="bg-accent hover:bg-accent/90">
                  <Icon name="Plus" className="w-4 h-4 mr-2" />
                  Продать золото
                </Button>
              </div>

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
                        <Button size="sm" className="bg-accent hover:bg-accent/90">
                          <Icon name="ShoppingBag" className="w-4 h-4 mr-2" />
                          Купить
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
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
                <Button className="w-full bg-destructive hover:bg-destructive/90">
                  <Icon name="Send" className="w-4 h-4 mr-2" />
                  Вывести
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
