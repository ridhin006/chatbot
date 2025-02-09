import random

class FactsService:
    def __init__(self):
        self.facts = [
            "The first computer mouse was made of wood!",
            "The first domain name ever registered was Symbolics.com",
            "The average person spends 6 months of their lifetime waiting for red lights to turn green.",
            "Honey never spoils. Archaeologists have found pots of honey in ancient Egyptian tombs that are over 3,000 years old!",
            "A day on Venus is longer than its year!",
            "The first oranges weren't orange - they were green!",
            "The shortest war in history lasted only 38 minutes between Britain and Zanzibar in 1896.",
            "Bananas are berries, but strawberries aren't!",
            "The first tweet was sent on March 21, 2006, by Jack Dorsey.",
            "The average cloud weighs around 1.1 million pounds!",
            "There are more possible iterations of a game of chess than there are atoms in the universe.",
            "A group of flamingos is called a 'flamboyance'.",
            "The first person convicted of speeding was going 8 mph.",
            "Nintendo was founded in 1889 as a playing card company.",
            "The word 'robot' comes from the Czech word 'robota' which means forced labor."
        ]
    
    def get_random_fact(self):
        return random.choice(self.facts)
